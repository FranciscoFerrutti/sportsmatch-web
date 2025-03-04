import apiClient from "@/apiClients";

// 📌 Tipo de respuesta esperada
interface ImageResponse {
    status: number;
    imageURL?: string;
    message?: string;
}

// 📌 Obtener la imagen del usuario
export const fetchUserImage = async (userId: number): Promise<ImageResponse> => {
    console.log(`📌 Solicitando imagen para usuario ${userId}`);

    try {
        const res = await apiClient.get(`/users/${userId}/image`, {
            headers: { "c-api-key": localStorage.getItem("c-api-key") || "" },
        });

        if (res.status !== 200) {
            console.error(`❌ Error al obtener la imagen: ${res.status}`);
            return { status: res.status, message: "Failed to fetch user image" };
        }

        const { presignedGetUrl } = res.data;
        console.log(`✅ Presigned GET URL recibida: ${presignedGetUrl}`);

        const response = await fetch(presignedGetUrl);
        if (!response.ok) throw new Error("Failed to fetch image");

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);

        return { status: 200, imageURL: imageUrl };
    } catch (error) {
        console.error("❌ Error al procesar la imagen:", error);
        return { status: 500, message: "Failed to process image" };
    }
};

// 📌 Subir la imagen del usuario
export const updateUserImage = async (userId: number, file: File): Promise<ImageResponse> => {
    console.log(`📌 Solicitando URL pre-firmada para subir imagen de usuario ${userId}`);

    try {
        const res = await apiClient.put(`/users/${userId}/image`, null, {
            headers: { "c-api-key": localStorage.getItem("c-api-key") || "" },
        });

        if (res.status !== 200) {
            console.error(`❌ Error al obtener pre-signed URL: ${res.status}`);
            return { status: res.status, message: "Failed to get upload URL" };
        }

        const { presignedPutUrl } = res.data;
        console.log(`✅ Presigned PUT URL recibida: ${presignedPutUrl}`);

        const uploadResponse = await fetch(presignedPutUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
        });

        if (!uploadResponse.ok) {
            throw new Error(`Failed to upload: ${uploadResponse.status}`);
        }

        console.log("✅ Imagen subida con éxito");
        return { status: 200, message: "Image update successful" };
    } catch (error) {
        console.error("❌ Error al subir imagen:", error);
        return { status: 500, message: "Failed to upload image" };
    }
};
