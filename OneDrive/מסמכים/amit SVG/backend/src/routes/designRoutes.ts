import { Router } from "express";
import { getDesigns, getDesignById, deleteDesign } from "../controllers/designController";

const router = Router();

router.get("/", getDesigns);
router.get("/:id", getDesignById);
router.delete("/:id", deleteDesign);

export default router;
