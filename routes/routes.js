import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import * as OrderController from "../controllers/OrderController.js";
import * as HealthController from "../controllers/HealthController.js";
import * as OnboardController from "../controllers/OnboardController.js";
import { handleTaskDeletion } from "../controllers/OnFleet/taskDeleted.js";
import { handleTaskAssigned } from "../controllers/OnFleet/taskAssigned.js";
import {
  driver_assigned,
  driver_coordinates,
  driver_unassigned,
} from "../controllers/DriverController.js";
import {
  requireAuth,
  handleLogin,
  handleLogout,
  verifyAuth,
} from "../middleware/auth.js";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = "your-secret-key";

const router = express.Router();

//-- *********** Import Controller Functions *********** --//

// Auth routes
router.post("/api/auth/login", handleLogin);
router.get("/api/auth/logout", handleLogout);
router.get("/api/auth/verify", verifyAuth);

// Serve login page
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/login.html"));
});

// Protected routes middleware for onboarding only
const protectOnboardRoute = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/login");
  }
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.clearCookie("token", { path: "/" });
    return res.redirect("/login");
  }
};

/** Protected Onboarding Routes */
router.get("/onboard-stitch", protectOnboardRoute, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/onboard-stitch.html"));
});

router.get("/onboard-onfleet", protectOnboardRoute, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/onboard-onfleet.html"));
});

// Root redirect
router.get("/", (req, res) => {
  res.redirect("/login");
});

// Health Check
router.get("/health", HealthController.check_heatlth);

/** Order Routes Below */
router
  .route("/order/:id/status")
  .get(OrderController.get_order_status)
  .post(OrderController.get_order_status);

router.route("/order/:id/details").post(OrderController.order_details_change);

router.route("/order").post(OrderController.order_details);

router
  .route("/order/:id/dsp_declined")
  .get(OrderController.order_dsp_declined)
  .post(OrderController.order_dsp_declined);

/** Driver Routes Below */
router.route("/driver/:id/assigned").get(driver_assigned).post(driver_assigned);

router
  .route("/driver/:id/unassigned")
  .get(driver_unassigned)
  .post(driver_unassigned);

router
  .route("/driver/:id/coordinates")
  .get(driver_coordinates)
  .post(driver_coordinates);

/** OnFleet Task Deletion Route */
router
  .route("/onfleet/deleteTask")
  .get((req, res) => {
    res.status(200).send(req.query.check);
  })
  .post(handleTaskDeletion);

/** OnFleet Task Assigned Route */
router
  .route("/onfleet/assignTask")
  .get((req, res) => {
    res.status(200).send(req.query.check);
  })
  .post(handleTaskAssigned);

/** Onboard API Routes */
router.post("/api/onboard/onfleet", OnboardController.handleOnfleetOnboard);
router.post("/api/onboard/stitch", OnboardController.handleStitchOnboard);
router.get("/api/onfleet/teams", OnboardController.getOnfleetTeams);

export default router;
