// Vercel Serverless Function to proxy Unsplash API requests
// This keeps your API key secure on the server side

export default async function handler(req, res) {
    const { query, page } = req.query;
    const accessKey = process.env.UNSPLASH_API_KEY;

    if (!accessKey) {
        return res.status(500).json({ 
            errors: ["Vercel environment variable 'UNSPLASH_API_KEY' is not set."] 
        });
    }

    if (!query) {
        return res.status(400).json({ errors: ["Query parameter is required."] });
    }

    const perPage = 12;
    const url = `https://api.unsplash.com/search/photos?page=${page || 1}&query=${query}&per_page=${perPage}&client_id=${accessKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Pass through the same status code and data from Unsplash
        return res.status(response.status).json(data);
    } catch (error) {
        console.error("Unsplash proxy error:", error);
        return res.status(500).json({ errors: ["Failed to fetch from Unsplash."] });
    }
}
