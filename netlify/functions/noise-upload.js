const axios = require('axios');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { colorMode, hex, r, g, b, tiles, tileSize, borderWidth, mode } = JSON.parse(event.body);

    // Build php-noise URL
    const colorParams = colorMode === 'hex' 
      ? `hex=${hex.replace(/^#/, '')}` 
      : `r=${r}&g=${g}&b=${b}`;
    
    const noiseUrl = `https://php-noise.com/noise.php?${colorParams}&tiles=${tiles}&tileSize=${tileSize}&borderWidth=${borderWidth}&mode=${mode}&json&base64`;

    // Fetch noise image (base64)
    const noiseResp = await axios.get(noiseUrl);
    const base64Image = noiseResp.data.base64;

    // Upload to ImgBB using environment variable
    const formData = new URLSearchParams();
    formData.append('key', process.env.IMGBB_API_KEY);
    formData.append('image', base64Image);

    const imgbbResp = await axios.post('https://api.imgbb.com/1/upload', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!imgbbResp.data.success) {
      throw new Error('ImgBB upload failed');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: imgbbResp.data.data.url })
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
