export const generateImage = async (prompt: string, size: "1024x1024" | "1024x1792" = "1024x1024") => {
    try {
        const response = await fetch('https://toolkit.rork.com/images/generate/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                size
            })
        });

        if (!response.ok) {
            throw new Error(`Image generation failed: ${response.statusText}`);
        }

        const { image } = await response.json();
        return image; // Returns { base64Data, mimeType }
    } catch (error) {
        console.error('AI Image Generation Error:', error);
        throw error;
    }
};

export const editImage = async (imageB64: string, prompt: string) => {
    try {
        const response = await fetch('https://toolkit.rork.com/images/edit/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                images: [{ type: 'image', image: imageB64 }],
                aspectRatio: "16:9"
            })
        });

        if (!response.ok) {
            throw new Error(`Image editing failed: ${response.statusText}`);
        }

        const { image } = await response.json();
        return image;
    } catch (error) {
        console.error('AI Image Editing Error:', error);
        throw error;
    }
};
