module.exports = {
    check_heatlth: async (req, res) => {
        try {
          res.status(200).json({
            status: "healthy",
          });
        } catch (err) {
          res.status(500).json({ status: "fail", message: err.message });
        }
      },
}