#!/bin/bash

# Test script for Make.com webhook
# This sends sample data to test what the webhook receives

WEBHOOK_URL="https://hook.eu2.make.com/57rv84gi6gmmqv0r6732the3z2uttk29"

echo "🧪 Testing Make.com Webhook"
echo "=============================="
echo ""
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Create a sample product data payload (based on your Akeneo structure)
PRODUCT_DATA='{
  "uuid": "test-uuid-12345",
  "identifier": "TEST_SKU_001",
  "family": "accessories",
  "parent": null,
  "categories": ["test_category"],
  "enabled": true,
  "values": {
    "sku": [
      {
        "locale": null,
        "scope": null,
        "data": "TEST_SKU_001"
      }
    ],
    "description": [
      {
        "locale": "en_US",
        "scope": null,
        "data": "This is an existing description that might be replaced by AI"
      }
    ],
    "weight": [
      {
        "locale": null,
        "scope": null,
        "data": "1.5"
      }
    ]
  },
  "created": "2024-11-01T10:00:00+00:00",
  "updated": "2024-11-27T09:00:00+00:00"
}'

# Check if a test file is provided
if [ -z "$1" ]; then
  echo "⚠️  No test file provided. Creating a dummy file..."
  echo "Sample Product Datasheet - TEST_SKU_001" > /tmp/test-datasheet.txt
  echo "" >> /tmp/test-datasheet.txt
  echo "Product: Test Widget" >> /tmp/test-datasheet.txt
  echo "Weight: 2.5 kg" >> /tmp/test-datasheet.txt
  echo "Dimensions: 100 x 50 x 30 cm" >> /tmp/test-datasheet.txt
  echo "Material: Stainless Steel" >> /tmp/test-datasheet.txt
  echo "Color: Silver" >> /tmp/test-datasheet.txt
  echo "" >> /tmp/test-datasheet.txt
  echo "Description: High-performance industrial widget with advanced features for professional use." >> /tmp/test-datasheet.txt

  TEST_FILE="/tmp/test-datasheet.txt"
  echo "✅ Created test file: $TEST_FILE"
else
  TEST_FILE="$1"
  echo "📄 Using provided file: $TEST_FILE"
fi

echo ""
echo "📤 Sending test request..."
echo ""

# Send the request
curl -X POST "$WEBHOOK_URL" \
  -F "file=@$TEST_FILE" \
  -F "productUuid=test-uuid-12345" \
  -F "productData=$PRODUCT_DATA" \
  -w "\n\n📊 HTTP Status: %{http_code}\n" \
  -v

echo ""
echo "=============================="
echo "✅ Test request sent!"
echo ""
echo "Now check your Make.com scenario:"
echo "1. Go to Make.com"
echo "2. Open your scenario"
echo "3. Click 'History' tab"
echo "4. See the incoming data structure"
echo ""
echo "You should see:"
echo "  - file: [Binary data]"
echo "  - productUuid: test-uuid-12345"
echo "  - productData: [JSON string]"
echo ""
