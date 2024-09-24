module.exports = {
  driver_assigned: async (req, res) => {
    try {
      res.status(200).json({
        status: "success",
      });
      //   const { teamUUID, status, teamId } = req.query;

      //   if (teamUUID && status && teamId) {
      //     console.log(teamUUID, status, teamId, "This is Query Data");
      //     console.log(req.params.id, "This is Parameter");
      //     res.status(200).json({
      //       status: "success",
      //     });
      //   } else {
      //     res.status(400).json({
      //       status: "fail",
      //       message: "Please check Parameter value is missing",
      //     });
      //   }
    } catch (err) {
      res.status(500).json({ status: "fail", message: err.message });
    }
  },
  driver_unassigned: async (req, res) => {
    try {
      res.status(200).json({
        status: "success",
      });
      //   const { teamUUID, status, teamId } = req.query;

      //   if (teamUUID && status && teamId) {
      //     console.log(teamUUID, status, teamId, "This is Query Data");
      //     console.log(req.params.id, "This is Parameter");
      //     res.status(200).json({
      //       status: "success",
      //     });
      //   } else {
      //     res.status(400).json({
      //       status: "fail",
      //       message: "Please check Parameter value is missing",
      //     });
      //   }
    } catch (err) {
      res.status(500).json({ status: "fail", message: err.message });
    }
  },
  driver_coordinates: async (req, res) => {
    try {
      res.status(200).json({
        status: "success",
      });
      //   const { teamUUID, status, teamId } = req.query;

      //   if (teamUUID && status && teamId) {
      //     console.log(teamUUID, status, teamId, "This is Query Data");
      //     console.log(req.params.id, "This is Parameter");
      //     res.status(200).json({
      //       status: "success",
      //     });
      //   } else {
      //     res.status(400).json({
      //       status: "fail",
      //       message: "Please check Parameter value is missing",
      //     });
      //   }
    } catch (err) {
      res.status(500).json({ status: "fail", message: err.message });
    }
  },
};
