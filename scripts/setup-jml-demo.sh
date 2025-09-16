#!/bin/bash

# Create JML Demo D1 Database
echo "Creating JML Demo D1 Database..."

# Create the database
wrangler d1 create jml-demo

echo "Database created! Update the database_id in wrangler.toml, then run:"
echo "wrangler d1 execute jml-demo --file=./migrations/001_jml_demo_schema.sql"

echo ""
echo "R2 Bucket Setup:"
echo "The demo will use your existing 'jw-site-media' R2 bucket"
echo "Demo data will be stored in folder: jml-demo/"
echo "  - jml-demo/steps/ - Individual step execution logs"
echo "  - jml-demo/audits/ - Employee audit trails"
echo ""
echo "No additional R2 setup needed!"
