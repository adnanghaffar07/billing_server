import { sendSlackMessage } from "../utils/slackConfig.js";

export const driver_assigned = async (req, res) => {
    try {
      const body = req.body;
      const query = req.query;

      if(!req.params.id){
      return  res.status(404).json({

          status: "Not Found",
        });
      }
      if (req.body) {
        const slackMessage = {
          text: `Driver Details`,
          blocks: [
            {
              type: "rich_text",
              elements: [
                {
                  type: "rich_text_preformatted",
                  border: 0,
                  elements: [
                    {
                      type: "text",
                      text: `CartWheel Driver Assigned\n`,
                      style: {
                        bold: true,
                      },
                    },
                    {
                      type: "text",
                      text: JSON.stringify({"id": `${req.params.id}`, "body": body, "query": query}, null, 2),
                      style: {
                        bold: true,
                      },
                    }
                  ]
                }
              ]
            }
          ]
        };
        await sendSlackMessage({
          text: slackMessage.text,
          blocks: slackMessage.blocks,
        });
        
      }
      res.status(200).json({

        status: "success",
      });
    } catch (err) {
      res.status(500).json({ status: "fail", message: err.message });
    }
  }
 export const driver_unassigned = async (req, res) => {
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
  }
 export const driver_coordinates = async (req, res) => {
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
  }
