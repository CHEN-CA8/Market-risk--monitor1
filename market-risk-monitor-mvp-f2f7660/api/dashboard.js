const { getDashboardData } = require("../backend/marketService");

module.exports = async function handler(req, res) {
  try {
    const data = await getDashboardData({ force: req.query && req.query.force === "1" });
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=300");
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
