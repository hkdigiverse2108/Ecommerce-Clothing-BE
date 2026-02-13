import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

async function testSlugSku() {
    try {
        console.log("Testing Slug and SKU Features...");

        console.log(`
        Manual Verification Steps:
        
        1. Test Slug Uniqueness:
           - Login and get token.
           - POST ${API_URL}/product/create
             Body: { name: "Duplicate Slug Product", ...other_fields }
             (Run twice with same name)
           - Check DB or Response: Second product should have slug like "duplicate-slug-product-1234".

        2. Test getProductBySlug:
           - GET ${API_URL}/product/get/slug/duplicate-slug-product
           - GET ${API_URL}/product/get/slug/duplicate-slug-product-1234
           - Verify response contains product details, variants, and rating.

        3. Test Search by SKU:
           - GET ${API_URL}/variant/get?search=some-sku-here
           - Verify response contains the specific variant.
        `);

    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testSlugSku();
