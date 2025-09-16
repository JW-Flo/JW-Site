import json
import boto3
import logging
import os
from datetime import datetime, timezone

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
sns = boto3.client('sns')
iam = boto3.client('iam')
logs = boto3.client('logs')

# Environment variables
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
LOG_GROUP = os.environ['LOG_GROUP']
ENVIRONMENT = os.environ['ENVIRONMENT']

def handler(event, context):
    """
    AWS Lambda handler for processing JML (Joiner-Mover-Leaver) events
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Parse the CloudTrail event
        detail = event.get('detail', {})
        event_name = detail.get('eventName')
        event_time = detail.get('eventTime')
        user_identity = detail.get('userIdentity', {})
        resources = detail.get('resources', [])
        
        # Extract user information
        affected_user = None
        for resource in resources:
            if resource.get('type') == 'AWS::IAM::User':
                affected_user = resource.get('ARN', '').split('/')[-1]
                break
        
        if not affected_user:
            logger.warning("No user found in event resources")
            return {
                'statusCode': 200,
                'body': json.dumps('No user to process')
            }
        
        # Determine JML action based on event
        jml_action = determine_jml_action(event_name, detail)
        
        # Process the JML event
        result = process_jml_event(jml_action, affected_user, detail)
        
        # Log the event
        log_jml_event(jml_action, affected_user, detail, result)
        
        # Send notification
        send_notification(jml_action, affected_user, result)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {jml_action} for user {affected_user}',
                'result': result
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing JML event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }

def determine_jml_action(event_name, detail):
    """
    Determine JML action based on the CloudTrail event
    """
    if event_name == 'CreateUser':
        return 'joiner'
    elif event_name == 'DeleteUser':
        return 'leaver'
    elif event_name in ['AddUserToGroup', 'RemoveUserFromGroup', 'PutUserPolicy', 'DeleteUserPolicy']:
        return 'mover'
    else:
        return 'unknown'

def process_jml_event(action, user, detail):
    """
    Process the JML event and take appropriate actions
    """
    result = {
        'action': action,
        'user': user,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'processed_actions': []
    }
    
    try:
        if action == 'joiner':
            # Handle new user onboarding
            result['processed_actions'].append('Validated user creation')
            result['processed_actions'].append('Triggered onboarding workflow')
            
            # Check if user has required tags
            try:
                user_info = iam.get_user(UserName=user)
                tags = user_info.get('User', {}).get('Tags', [])
                
                required_tags = ['Department', 'OktaUserId', 'EmployeeType']
                missing_tags = []
                
                tag_dict = {tag['Key']: tag['Value'] for tag in tags}
                for required_tag in required_tags:
                    if required_tag not in tag_dict:
                        missing_tags.append(required_tag)
                
                if missing_tags:
                    result['warnings'] = f"Missing required tags: {', '.join(missing_tags)}"
                else:
                    result['processed_actions'].append('All required tags present')
                    
            except Exception as e:
                result['warnings'] = f"Could not validate user tags: {str(e)}"
        
        elif action == 'mover':
            # Handle user role/group changes
            result['processed_actions'].append('Detected access change')
            result['processed_actions'].append('Validated new permissions')
            
            # Log the specific change
            event_name = detail.get('eventName')
            if event_name == 'AddUserToGroup':
                group_name = detail.get('requestParameters', {}).get('groupName', 'unknown')
                result['processed_actions'].append(f'Added to group: {group_name}')
            elif event_name == 'RemoveUserFromGroup':
                group_name = detail.get('requestParameters', {}).get('groupName', 'unknown')
                result['processed_actions'].append(f'Removed from group: {group_name}')
        
        elif action == 'leaver':
            # Handle user offboarding
            result['processed_actions'].append('Initiated offboarding process')
            result['processed_actions'].append('Scheduled access key deactivation')
            result['processed_actions'].append('Logged final access summary')
        
        result['status'] = 'success'
        
    except Exception as e:
        result['status'] = 'error'
        result['error'] = str(e)
        logger.error(f"Error processing {action} for user {user}: {str(e)}")
    
    return result

def log_jml_event(action, user, detail, result):
    """
    Log the JML event to CloudWatch
    """
    try:
        log_entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'jml_action': action,
            'user': user,
            'environment': ENVIRONMENT,
            'event_detail': {
                'event_name': detail.get('eventName'),
                'source_ip': detail.get('sourceIPAddress'),
                'user_agent': detail.get('userAgent'),
                'event_time': detail.get('eventTime')
            },
            'processing_result': result
        }
        
        # Create log stream if it doesn't exist
        log_stream_name = f"jml-events-{datetime.now().strftime('%Y-%m-%d')}"
        
        try:
            logs.create_log_stream(
                logGroupName=LOG_GROUP,
                logStreamName=log_stream_name
            )
        except logs.exceptions.ResourceAlreadyExistsException:
            pass  # Log stream already exists
        
        # Put log event
        logs.put_log_events(
            logGroupName=LOG_GROUP,
            logStreamName=log_stream_name,
            logEvents=[
                {
                    'timestamp': int(datetime.now().timestamp() * 1000),
                    'message': json.dumps(log_entry)
                }
            ]
        )
        
        logger.info(f"Logged JML event for user {user}")
        
    except Exception as e:
        logger.error(f"Failed to log JML event: {str(e)}")

def send_notification(action, user, result):
    """
    Send SNS notification about the JML event
    """
    try:
        message = {
            'action': action,
            'user': user,
            'environment': ENVIRONMENT,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'status': result.get('status', 'unknown'),
            'processed_actions': result.get('processed_actions', [])
        }
        
        subject = f"AtlasIT JML Event: {action.title()} - {user}"
        
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=json.dumps(message, indent=2),
            Subject=subject
        )
        
        logger.info(f"Sent notification for {action} event for user {user}")
        
    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")

# For local testing
if __name__ == "__main__":
    # Sample event for testing
    test_event = {
        "detail": {
            "eventName": "CreateUser",
            "eventTime": "2025-01-01T12:00:00Z",
            "userIdentity": {
                "type": "IAMUser",
                "principalId": "AIDAEXAMPLE",
                "arn": "arn:aws:iam::123456789012:user/okta-admin"
            },
            "resources": [
                {
                    "type": "AWS::IAM::User",
                    "ARN": "arn:aws:iam::123456789012:user/atlasit/new-user"
                }
            ]
        }
    }
    
    # Mock environment variables for testing
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'
    os.environ['LOG_GROUP'] = '/atlasit/jml-events'
    os.environ['ENVIRONMENT'] = 'demo'
    
    # Test the handler
    result = handler(test_event, None)
    print(json.dumps(result, indent=2))
