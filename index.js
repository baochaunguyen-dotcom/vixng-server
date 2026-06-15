const express = require('express');
const axios = require('axios');
const pdfImgConvert = require('pdf-img-convert'); // Thư viện chuyển PDF thành ảnh
const app = express();

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
    res.send("Server Vixng đang hoạt động!");
});

app.post('/', async (req, res) => {
    try {
        const payloadFromSheets = req.body;
        console.log(`=== [Nhận File] ${payloadFromSheets.filename || 'N/A'} ===`);

        // Phản hồi ngay lập tức cho Google Sheets để giải phóng tiến trình
        res.status(200).send("Đã nhận dữ liệu thành công. Server đang xử lý ngầm...");

        // Xử lý ngầm: Chuyển PDF thành ảnh và gửi sang SeaTalk
        setImmediate(async () => {
            try {
                const seatalkWebhookUrl = payloadFromSheets.webhook_url;
                const base64Data = payloadFromSheets.content_base64;

                if (!seatalkWebhookUrl || !base64Data) {
                    return console.error("[Lỗi ngầm]: Thiếu webhook URL hoặc nội dung file Base64.");
                }

                console.log("[Xử lý ngầm]: Đang chuyển đổi PDF sang định dạng ảnh...");
                
                // 1. Chuyển chuỗi Base64 thành Buffer dữ liệu thô
                const pdfBuffer = Buffer.from(base64Data, 'base64');

                // 2. Chuyển đổi PDF thành mảng các ảnh (định dạng ảnh là các Buffer mã hóa)
                const outputImages = await pdfImgConvert.convert(pdfBuffer, {
                    width: 1200 // Tăng độ nét cho ảnh bảng tính khi gửi sang SeaTalk
                });

                if (!outputImages || outputImages.length === 0) {
                    return console.error("[Lỗi ngầm]: Chuyển đổi PDF sang ảnh thất bại.");
                }

                console.log(`[Xử lý ngầm]: Chuyển đổi thành công. Phát hiện ${outputImages.length} trang ảnh. Tiến hành gửi sang SeaTalk...`);

                // 3. Lặp qua từng trang ảnh đã chuyển đổi và gửi sang SeaTalk bằng cấu hình tin nhắn Image
                for (let i = 0; i < outputImages.length; i++) {
                    const imgBase64 = outputImages[i].toString('base64');

                    // Cấu hình payload tin nhắn dạng hình ảnh chuẩn của SeaTalk Webhook
                    const seatalkPayload = {
                        "tag": "image",
                        "image": {
                            "base64_image": imgBase64
                        }
                    };

                    // Thực hiện gửi ảnh sang SeaTalk
                    await axios.post(seatalkWebhookUrl, seatalkPayload, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    console.log(`[Thành công]: Đã gửi trang ảnh thứ ${i + 1} sang SeaTalk.`);
                }

            } catch (bgError) {
                console.error("[Lỗi hệ thống chạy ngầm]:", bgError.message);
            }
        });

    } catch (error) {
        console.error("Lỗi đầu nhận:", error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server chạy tại port: ${PORT}`);
});
