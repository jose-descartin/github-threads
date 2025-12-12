// api/post-to-threads.js
// Vercel Serverless Function to post to Threads

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, caption, userId, accessToken } = req.body;

    // Validation
    if (!imageUrl || !userId || !accessToken) {
      return res.status(400).json({ 
        error: 'Missing required fields: imageUrl, userId, accessToken' 
      });
    }

    // Step 1: Create Threads media container
    const containerUrl = `https://graph.threads.net/v1.0/${userId}/threads?media_type=IMAGE&image_url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(caption || '')}&access_token=${accessToken}`;
    
    const containerResponse = await fetch(containerUrl, {
      method: 'POST'
    });

    const containerData = await containerResponse.json();

    if (containerData.error) {
      return res.status(400).json({ 
        error: containerData.error.message || 'Failed to create media container',
        details: containerData.error
      });
    }

    const creationId = containerData.id;

    // Step 2: Publish the post
    const publishUrl = `https://graph.threads.net/v1.0/${userId}/threads_publish?creation_id=${creationId}&access_token=${accessToken}`;
    
    const publishResponse = await fetch(publishUrl, {
      method: 'POST'
    });

    const publishData = await publishResponse.json();

    if (publishData.error) {
      return res.status(400).json({ 
        error: publishData.error.message || 'Failed to publish post',
        details: publishData.error
      });
    }

    // Success!
    return res.status(200).json({
      success: true,
      postId: publishData.id,
      message: 'Successfully posted to Threads!'
    });

  } catch (error) {
    console.error('Error posting to Threads:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
