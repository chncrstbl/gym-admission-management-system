import db from '../config/db.js';

export const getEquipment = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM equipment ORDER BY id DESC");
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const addEquipment = async (req, res) => {
    const { name, serialCode, category, condition, value, image } = req.body;
    const safeValue = value ? parseFloat(value) : 0.00;

    try {
        await db.query(
            "INSERT INTO equipment (name, serial_code, category, equipment_condition, asset_value, image) VALUES (?, ?, ?, ?, ?, ?)",
            [name, serialCode, category, condition, safeValue, image || null]
        );
        res.status(201).json({ message: "Equipment registered" });
    } catch (err) { 
        console.error("Add Equipment Error:", err);
        res.status(500).json({ error: err.message }); 
    }
};

export const updateEquipment = async (req, res) => {
    const { id } = req.params;
    const { name, category, condition, value, image } = req.body;

    try {
        if (name && category) {
            const safeValue = value ? parseFloat(value) : 0.00;
            await db.query(
                "UPDATE equipment SET name = ?, category = ?, equipment_condition = ?, asset_value = ?, image = ? WHERE id = ?",
                [name, category, condition, safeValue, image || null, id]
            );
        } else if (condition) {
            await db.query("UPDATE equipment SET equipment_condition = ? WHERE id = ?", [condition, id]);
        }
        res.json({ message: "Equipment updated" });
    } catch (err) { 
        console.error("Update Equipment Error:", err);
        res.status(500).json({ error: err.message }); 
    }
};

export const deleteEquipment = async (req, res) => {
    try {
        await db.query("DELETE FROM equipment WHERE id = ?", [req.params.id]);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};