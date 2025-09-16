#!/bin/bash

# AtlasIT Demo Setup and Integration Script
# This script sets up the complete Okta-AWS IAM automation demo

echo "🚀 Setting up AtlasIT Okta-AWS IAM Automation Demo..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed. Please install Terraform and try again."
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_warning "AWS CLI is not installed. You may need it for credential management."
fi

print_success "Prerequisites check completed"

# Set up API Manager
print_status "Setting up API Manager..."

cd atlasit/api-manager

# Install dependencies
if [ ! -d "node_modules" ]; then
    print_status "Installing API Manager dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "API Manager dependencies installed"
    else
        print_error "Failed to install API Manager dependencies"
        exit 1
    fi
else
    print_success "API Manager dependencies already installed"
fi

# Set up environment file
if [ ! -f ".env" ]; then
    print_status "Creating API Manager environment configuration..."
    cp .env.example .env
    print_warning "Please update .env with your actual Okta and AWS credentials"
    print_warning "Okta domain, API token, and AWS credentials are required"
else
    print_success "API Manager environment file already exists"
fi

# Build TypeScript
print_status "Building API Manager..."
npm run build
if [ $? -eq 0 ]; then
    print_success "API Manager built successfully"
else
    print_error "Failed to build API Manager"
    exit 1
fi

# Go back to root
cd ../..

# Set up Terraform
print_status "Setting up Terraform workspace..."

cd atlasit/terraform/aws-iam-demo

# Set up Terraform environment
if [ ! -f ".env" ]; then
    print_status "Creating Terraform environment configuration..."
    cp .env.example .env
    print_warning "Please update .env with your AWS credentials"
else
    print_success "Terraform environment file already exists"
fi

# Build Lambda function
print_status "Building Lambda function..."
chmod +x build-lambda.sh
./build-lambda.sh
if [ $? -eq 0 ]; then
    print_success "Lambda function built successfully"
else
    print_error "Failed to build Lambda function"
    exit 1
fi

# Initialize Terraform
print_status "Initializing Terraform..."
terraform init
if [ $? -eq 0 ]; then
    print_success "Terraform initialized successfully"
else
    print_error "Failed to initialize Terraform"
    exit 1
fi

# Validate Terraform configuration
print_status "Validating Terraform configuration..."
terraform validate
if [ $? -eq 0 ]; then
    print_success "Terraform configuration is valid"
else
    print_error "Terraform configuration validation failed"
    exit 1
fi

# Go back to root
cd ../../..

# Create startup script
print_status "Creating startup script..."
cat > start-demo.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting AtlasIT Demo..."

# Start API Manager
echo "Starting API Manager on port 3001..."
cd atlasit/api-manager
npm run dev &
API_MANAGER_PID=$!

# Wait for API Manager to start
sleep 5

# Check if API Manager is running
curl -s http://localhost:3001/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ API Manager is running on http://localhost:3001"
    echo "   Health check: http://localhost:3001/health/detailed"
    echo "   API docs: http://localhost:3001/api/okta"
else
    echo "❌ Failed to start API Manager"
    kill $API_MANAGER_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎯 Demo is ready!"
echo ""
echo "📋 Next steps:"
echo "1. Update environment files with real credentials:"
echo "   - atlasit/api-manager/.env (Okta credentials)"
echo "   - atlasit/terraform/aws-iam-demo/.env (AWS credentials)"
echo ""
echo "2. Test the health endpoint:"
echo "   curl http://localhost:3001/health/detailed"
echo ""
echo "3. View the demo guide:"
echo "   cat atlasit/terraform/aws-iam-demo/DEMO_GUIDE.md"
echo ""
echo "4. Access the API Manager UI:"
echo "   Open http://localhost:4321/api-manager in your browser"
echo ""
echo "5. Trigger a JML workflow:"
echo '   curl -X POST http://localhost:3001/api/okta/jml \'
echo '     -H "X-API-Key: atlasit-demo-api-key" \'
echo '     -H "Content-Type: application/json" \'
echo '     -d '"'"'{"userId":"demo@atlasit.pro","action":"joiner","targetSystems":["aws"]}'"'"
echo ""
echo "Press Ctrl+C to stop the demo"

# Keep script running
wait $API_MANAGER_PID
EOF

chmod +x start-demo.sh

# Create integration test script
print_status "Creating integration test script..."
cat > test-integration.sh << 'EOF'
#!/bin/bash

echo "🧪 Running AtlasIT Integration Tests..."

API_BASE="http://localhost:3001"
API_KEY="atlasit-demo-api-key"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_count=0
pass_count=0

run_test() {
    local test_name="$1"
    local command="$2"
    local expected_status="$3"
    
    test_count=$((test_count + 1))
    echo -n "Testing $test_name... "
    
    response=$(eval $command 2>/dev/null)
    status=$?
    
    if [ $status -eq $expected_status ]; then
        echo -e "${GREEN}PASS${NC}"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}FAIL${NC} (expected status $expected_status, got $status)"
    fi
}

# Test API Manager health
run_test "API Manager Health" "curl -s -o /dev/null -w '%{http_code}' $API_BASE/health" 0

# Test detailed health check
run_test "Detailed Health Check" "curl -s -H 'X-API-Key: $API_KEY' -o /dev/null -w '%{http_code}' $API_BASE/health/detailed" 0

# Test Okta integration (will fail without real credentials)
run_test "Okta Users Endpoint" "curl -s -H 'X-API-Key: $API_KEY' -o /dev/null -w '%{http_code}' $API_BASE/api/okta/users" 0

# Test authentication
run_test "Auth Required" "curl -s -o /dev/null -w '%{http_code}' $API_BASE/api/okta/groups" 0

echo ""
echo "📊 Test Results: $pass_count/$test_count tests passed"

if [ $pass_count -eq $test_count ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check configuration.${NC}"
    exit 1
fi
EOF

chmod +x test-integration.sh

# Create demonstration script
print_status "Creating demonstration script..."
cat > demo-scenarios.sh << 'EOF'
#!/bin/bash

echo "🎭 AtlasIT JML Demo Scenarios"

API_BASE="http://localhost:3001"
API_KEY="atlasit-demo-api-key"

# Demo users
JORDAN_USER='{"userId":"jordan.miles@atlasit.pro","action":"joiner","targetSystems":["aws"],"metadata":{"department":"Security","role":"security_engineer","startDate":"2025-01-15"}}'
MAYA_USER='{"userId":"maya.greene@atlasit.pro","action":"mover","targetSystems":["aws"],"metadata":{"role":"security_engineer","previousRole":"data_analyst","department":"Security"}}'
CONTRACTOR_USER='{"userId":"contractor@atlasit.pro","action":"leaver","targetSystems":["aws"],"metadata":{"endDate":"2025-02-01","reason":"Contract completion"}}'

echo ""
echo "📋 Available Demo Scenarios:"
echo "1. New Employee Onboarding (Jordan Miles - Security Engineer)"
echo "2. Role Change (Maya Greene - Data Analyst to Security Engineer)"
echo "3. Employee Departure (Contractor - Access Removal)"
echo "4. View All Scenarios"
echo "5. Exit"
echo ""

while true; do
    read -p "Select scenario (1-5): " choice
    
    case $choice in
        1)
            echo "🔄 Triggering Joiner workflow for Jordan Miles..."
            curl -X POST "$API_BASE/api/okta/jml" \
                -H "X-API-Key: $API_KEY" \
                -H "Content-Type: application/json" \
                -d "$JORDAN_USER" | jq '.' 2>/dev/null || echo "Response received"
            ;;
        2)
            echo "🔄 Triggering Mover workflow for Maya Greene..."
            curl -X POST "$API_BASE/api/okta/jml" \
                -H "X-API-Key: $API_KEY" \
                -H "Content-Type: application/json" \
                -d "$MAYA_USER" | jq '.' 2>/dev/null || echo "Response received"
            ;;
        3)
            echo "🔄 Triggering Leaver workflow for Contractor..."
            curl -X POST "$API_BASE/api/okta/jml" \
                -H "X-API-Key: $API_KEY" \
                -H "Content-Type: application/json" \
                -d "$CONTRACTOR_USER" | jq '.' 2>/dev/null || echo "Response received"
            ;;
        4)
            echo "🔄 Running all scenarios..."
            echo "Scenario 1: Joiner"
            curl -X POST "$API_BASE/api/okta/jml" \
                -H "X-API-Key: $API_KEY" \
                -H "Content-Type: application/json" \
                -d "$JORDAN_USER" -s | jq '.' 2>/dev/null || echo "Response received"
            
            sleep 2
            
            echo "Scenario 2: Mover"
            curl -X POST "$API_BASE/api/okta/jml" \
                -H "X-API-Key: $API_KEY" \
                -H "Content-Type: application/json" \
                -d "$MAYA_USER" -s | jq '.' 2>/dev/null || echo "Response received"
            
            sleep 2
            
            echo "Scenario 3: Leaver"
            curl -X POST "$API_BASE/api/okta/jml" \
                -H "X-API-Key: $API_KEY" \
                -H "Content-Type: application/json" \
                -d "$CONTRACTOR_USER" -s | jq '.' 2>/dev/null || echo "Response received"
            ;;
        5)
            echo "👋 Demo complete!"
            exit 0
            ;;
        *)
            echo "Invalid choice. Please select 1-5."
            ;;
    esac
    
    echo ""
done
EOF

chmod +x demo-scenarios.sh

print_success "Setup completed successfully!"

echo ""
echo "🎉 AtlasIT Demo Setup Complete!"
echo ""
echo "📁 Created files:"
echo "   - start-demo.sh (Start the complete demo)"
echo "   - test-integration.sh (Run integration tests)"
echo "   - demo-scenarios.sh (Interactive demo scenarios)"
echo ""
echo "🔧 Configuration files created:"
echo "   - atlasit/api-manager/.env (Update with Okta credentials)"
echo "   - atlasit/terraform/aws-iam-demo/.env (Update with AWS credentials)"
echo ""
echo "🚀 To start the demo:"
echo "   1. Update environment files with real credentials"
echo "   2. Run: ./start-demo.sh"
echo "   3. Open browser to: http://localhost:4321/api-manager"
echo ""
echo "📖 For detailed instructions, see:"
echo "   atlasit/terraform/aws-iam-demo/DEMO_GUIDE.md"
echo ""
echo "⚡ Quick test:"
echo "   ./test-integration.sh"
