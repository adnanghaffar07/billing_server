const express = require("express");
const router = express.Router();

//-- *********** Import Controller Functions *********** --// 

const DriverController = require("../controllers/DriverController");
const OrderController = require("../controllers/OrderController");
const HealthController = require("../controllers/HealthController");

router.get("/", (req, res) => {
  res.redirect('https://trydragonfly.com')
})

/**Health Check */
router.route("/health")
  .get(HealthController.check_heatlth)

/** Order Routes Below */

router.route("/order/:id/status")
  .get(OrderController.get_order_status)
  .post(OrderController.get_order_status)

router.route("/order")
  .post(OrderController.order_details)

router.route("/order/:id/dsp_declined")
  .get(OrderController.order_dsp_declined)
  .post(OrderController.order_dsp_declined)


/** Driver Routes Below */

router.route("/driver/:id/assigned")
  .get(DriverController.driver_assigned)
  .post(DriverController.driver_assigned)


router.route("/driver/:id/unassigned")
  .get(DriverController.driver_unassigned)
  .post(DriverController.driver_unassigned)

router.route("/driver/:id/coordinates")
  .get(DriverController.driver_coordinates)
  .post(DriverController.driver_coordinates)



module.exports = router;


