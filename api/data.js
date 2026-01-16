export default async function handler(req, res) {
    const firebaseURL = "https://teslamstore-df0a5-default-rtdb.firebaseio.com/apps.json";
    try {
        const response = await fetch(firebaseURL);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Error fetching data" });
    }
}
