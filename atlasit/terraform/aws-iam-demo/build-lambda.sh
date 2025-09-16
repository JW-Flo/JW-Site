#!/bin/bash

# Build script for JML Lambda function
# This script packages the Lambda function for deployment

echo "Building JML Lambda function..."

# Create build directory
mkdir -p build
cd build

# Copy Python files
cp ../lambda/jml_processor.py index.py

# Create requirements.txt (boto3 is provided by Lambda runtime)
cat > requirements.txt << EOF
# No additional dependencies needed
# boto3 and botocore are provided by AWS Lambda runtime
EOF

# Create the deployment package
zip -r ../jml_processor.zip index.py requirements.txt

# Clean up
cd ..
rm -rf build

echo "Lambda function packaged as jml_processor.zip"
echo "Deploy with: terraform apply"
