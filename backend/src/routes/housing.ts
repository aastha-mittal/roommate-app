import { Router } from "express";
import {
  FIRST_YEAR_DORMS,
  UPPERCLASS_ON_CAMPUS,
  OFF_CAMPUS_NEIGHBORHOODS,
  ROOM_STYLE_OPTIONS,
  OFF_CAMPUS_ROOM_TYPES,
  dormListForUser,
} from "../config/housing.js";
import { requireAuth } from "../middleware/auth.js";

const housingRouter = Router();

/** Public config for building adaptive onboarding (auth optional — still require login for consistency). */
housingRouter.get("/options", requireAuth, (req, res) => {
  const firstYear = req.query.firstYear === "true" || req.query.firstYear === "1";
  const housingType = req.query.housingType === "ON_CAMPUS" ? "ON_CAMPUS" : req.query.housingType === "OFF_CAMPUS" ? "OFF_CAMPUS" : null;

  const onCampusDorms = dormListForUser(firstYear).map((d) => ({ id: d.id, label: d.label }));

  return res.json({
    firstYearDorms: FIRST_YEAR_DORMS,
    upperclassDorms: UPPERCLASS_ON_CAMPUS,
    onCampusDorms,
    neighborhoods: OFF_CAMPUS_NEIGHBORHOODS,
    roomStyles: ROOM_STYLE_OPTIONS,
    offCampusRoomTypes: OFF_CAMPUS_ROOM_TYPES,
    housingType,
  });
});

export { housingRouter };
