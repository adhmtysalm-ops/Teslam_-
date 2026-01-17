export default async function handler(req, res) {
    const firebaseURL = "https://teslamstore-df0a5-default-rtdb.firebaseio.com/apps.json";
    
    // الحصول على رابط الموقع اللي باعت الطلب
    const referer = req.headers.referer || "";
    const host = req.headers.host || "";

    // السماح فقط بالطلبات اللي جاية من موقعك (سواء الدومين الرسمي أو localhost للتجربة)
    if (referer.includes("teslam.vercel.app") || host.includes("localhost")) {
        try {
            const response = await fetch(firebaseURL);
            const data = await response.json();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: "خطأ في جلب البيانات" });
        }
    } else {
        // لو حد حاول يفتحه يدوي من المتصفح أو موقع تاني
        res.status(403).json({ error: "غير مسموح لك بالوصول المباشر لهذه البيانات" });
    }
}
