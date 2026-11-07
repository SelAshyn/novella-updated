// Quick test script for Cloudinary connection
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'yy03trbx',
  api_key: '838654618838328',
  api_secret: 'iNozgTbcuG_5mGwcGXuxnHC4swU',
  secure: true,
});

async function testCloudinary() {
  try {
    console.log('🔍 Testing Cloudinary connection...\n');
    
    // Test API connectivity
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary API is reachable!');
    console.log('   Status:', result.status);
    
    // Get usage information
    const usage = await cloudinary.api.usage();
    console.log('\n📊 Account Usage:');
    console.log('   Plan:', usage.plan);
    console.log('   Credits used:', usage.credits.usage);
    console.log('   Credits limit:', usage.credits.limit);
    console.log('   Storage:', Math.round(usage.storage.usage / 1024 / 1024), 'MB');
    console.log('   Bandwidth:', Math.round(usage.bandwidth.usage / 1024 / 1024), 'MB');
    
    console.log('\n✨ Cloudinary is ready to use!');
    console.log('   Cloud Name: yy03trbx');
    console.log('   Upload URL: https://api.cloudinary.com/v1_1/yy03trbx/image/upload');
    
  } catch (error) {
    console.error('❌ Cloudinary test failed:');
    console.error('   Error:', error.message);
    
    if (error.error?.message) {
      console.error('   Details:', error.error.message);
    }
    
    console.log('\n💡 Troubleshooting:');
    console.log('   - Check cloud_name is correct');
    console.log('   - Check API key and secret are correct');
    console.log('   - Make sure you have internet connection');
    console.log('   - Verify account is active at cloudinary.com');
  }
}

testCloudinary();
