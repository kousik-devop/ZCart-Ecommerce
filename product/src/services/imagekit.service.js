const ImageKit = require('imagekit');
const { randomUUID } = require('crypto');



const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'test_public',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'test_private',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/demo',
});

async function uploadImage({ buffer, folder = '/products' }) {
    const res = await imagekit.upload({
        file: buffer,
        fileName: randomUUID(),
        folder,
    });
    return {
        url: res.url,
        thumbnail: res.thumbnailUrl || res.url,
        id: res.fileId,
    };
}

async function deleteImage(imageId) {
    return imagekit.deleteFile(imageId);
}

module.exports = { imagekit, uploadImage, deleteImage };