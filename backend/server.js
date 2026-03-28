// packages import 
const express = require ('express');
const mysql = require ('mysql2');
const cors = require ('cors');
const multer = require ('multer');
const path = require ('path');
const fs = require ('fs');
require('dotenv').config();

const app = express();

//MiddleWare 
app.use(cors());
app.use(express.json());

//Database connection 
const db = mysql.createConnection({
    host:'localhost',
    user:'root',
    password: process.env.DB_PASSWORD,
    database:'student_management'
});

console.log("Server is running...")

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, 
    fileFilter: fileFilter 
});

const validateStudentData = (name, email, course, age, mobile) => {
    //Missing data check
    if (!name || !email || !course || !age || !mobile) return "All Fields are mandatory to fill!";
    
    //Name check (Only alphabets and spaces)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) return "Name can only contain alphabets and spaces.";
    
    //Email check
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address.";
    
    //Age check
    if (age < 16 || age > 100) return "Age must be between 16 and 100.";

    //mobile no. check
    const mobileRegex = /^[6-9][0-9]{9}$/;
    if (!mobileRegex.test(mobile)) return "Mobile number must be 10 digits and start with 6, 7, 8, or 9.";
    
    return null; 
};

// create student (post request)
app.post('/api/students', upload.single('profile_img'), (req, resp) => {
    const {name, email, course, age, gender, dob, mobile, is_active} = req.body;
    const errorMsg = validateStudentData(name, email, course, age, mobile);
    if (errorMsg) return resp.status(400).send({error: errorMsg});
    if (!req.file) {
        return resp.status(400).send({error: "Profile Photo is mandatory! Please upload an image."});
    }
    const profile_img = 'http://localhost:4000/uploads/' + req.file.filename; 

    const sql = "INSERT INTO students(name, email, course, age, gender, dob, mobile, is_active, profile_img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    db.query(sql, [name, email, course, age, gender, dob, mobile, is_active, profile_img], (error, result) => {
        if (error) {
            if (error.code == 'ER_DUP_ENTRY') return resp.status(409).send({error: "Email already exists!"});
            return resp.status(500).send({error: "Internal Server Error"});
        }
        resp.status(201).send({message: "Student added successfully!"});
    });
});

// get all students (get request)
app.get('/api/students',(req,resp)=>{
    const sql = "SELECT * FROM students";

    db.query(sql,(error,result)=>{
        if (error) {
            return resp.status(500).send("Internal Server Error");
        }
        resp.status(200).send(result);
    })
});

// get student by id
app.get('/api/students/:id',(req,resp)=>{
    const studentId = req.params.id;

    const sql = "SELECT * FROM students WHERE student_id=?";

    db.query(sql,[studentId],(error,result)=>{
        if (error){
            return resp.status(500).send("Internal Server Error");
        }
        if (result.length===0){
            return resp.status(404).send({error: "Student not Found!"});
        }
        resp.status(200).send(result[0]);
    })
});

//update student (put request)
app.put('/api/students/:id', upload.single('profile_img'), (req, resp) => {
    const studentId = req.params.id;
    const {name, email, course, age, gender, dob, mobile, is_active} = req.body;

    const errorMsg = validateStudentData(name, email, course, age, mobile);
    if (errorMsg) return resp.status(400).send({error: errorMsg});

    if (req.file) {
        const profile_img = 'http://localhost:4000/uploads/' + req.file.filename;
        const sql = "UPDATE students SET name=?, email=?, course=?, age=?, gender=?, dob=?, mobile=?, is_active=?, profile_img=? WHERE student_id=?";
        
        db.query(sql, [name, email, course, age, gender, dob, mobile, is_active, profile_img, studentId], (error, result) => {
            if (error) {
                if (error.code == 'ER_DUP_ENTRY') return resp.status(409).send({error: "Email already exists!"});
                return resp.status(500).send({error: "Internal Server Error"});
            }
            resp.status(200).send({message: "Student & Photo Updated Successfully."});
        });
    } 
    else {
        const sql = "UPDATE students SET name=?, email=?, course=?, age=?, gender=?, dob=?, mobile=?, is_active=? WHERE student_id=?";
        
        db.query(sql, [name, email, course, age, gender, dob, mobile, is_active, studentId], (error, result) => {
            if (error) {
                if (error.code == 'ER_DUP_ENTRY') return resp.status(409).send({error: "Email already exists!"});
                return resp.status(500).send({error: "Internal Server Error"});
            }
            resp.status(200).send({message: "Student Details Updated Successfully."});
        });
    }
});

//delete student 
app.delete('/api/students/:id', (req, resp) => {
    const studentId = req.params.id;
    const deleteResultSql = "DELETE FROM student_result WHERE student_id=?";
    
    db.query(deleteResultSql, [studentId], (err, res) => {
        if (err) {
            console.log("Error deleting result:", err);
            return resp.status(500).send({ error: "Failed to delete student marks." });
        }

        const deleteStudentSql = "DELETE FROM students WHERE student_id=?";
        
        db.query(deleteStudentSql, [studentId], (error, result) => {
            if (error) {
                console.log("Error deleting student:", error);
                return resp.status(500).send({ error: "Internal Server Error" });
            }
            if (result.affectedRows === 0) {
                return resp.status(404).send({ error: "Student not Found!" });
            }
            resp.status(200).send({ message: "Student and their marks deleted successfully." });
        });
    });
});

//to get report card 
app.get('/api/reports',(req,resp)=>{
    const sql = "SELECT students.name, students.course, student_result.total_marks, student_result.percentage FROM students INNER JOIN student_result ON students.student_id = student_result.student_id";

    db.query(sql,(error,result)=>{
        if (error){
            console.log('JOIN query error:', error.sqlMessage || error);
            return resp.status(500).send('Internal Server Error.');
        }
        resp.status(200).send(result);
    })
});

//to get report card of a specific student 
app.get('/api/reports/:id',(req,resp)=>{
    const studentId = req.params.id;

    const sql = "SELECT students.name, students.course, student_result.DBMS_marks, student_result.Java_marks, student_result.Python_marks, student_result.total_marks, student_result.percentage FROM students INNER JOIN student_result ON students.student_id = student_result.student_id WHERE students.student_id = ?";

    db.query(sql,[studentId],(error,result)=>{
        if (error){
            return resp.status(500).send('Internal Server Error');
        }
        if (result.length===0){
            return resp.status(404).send({error:"Report not found."});
        }
        resp.status(200).send(result[0]);
    })
})

app.use('/uploads', express.static('uploads'));




// to add or update marks of students
app.post('/api/marks', (req, resp) => {
    const { student_id, DBMS_marks, Java_marks, Python_marks } = req.body;
    const total = Number(DBMS_marks) + Number(Java_marks) + Number(Python_marks);
    const percentage = (total / 300) * 100;
    const checkSql = "SELECT * FROM student_result WHERE student_id = ?";
    
    db.query(checkSql, [student_id], (err, result) => {
        if (err) return resp.status(500).send({error: "Database error"});

        if (result.length > 0) {
            const updateSql = "UPDATE student_result SET DBMS_marks=?, Java_marks=?, Python_marks=?, total_marks=?, percentage=? WHERE student_id=?";
            db.query(updateSql, [DBMS_marks, Java_marks, Python_marks, total, percentage.toFixed(2), student_id], (e, r) => {
                if (e) return resp.status(500).send({error: "Update failed"});
                resp.status(200).send({message: "Marks Updated Successfully!"});
            });
        } else {
            const insertSql = "INSERT INTO student_result (student_id, DBMS_marks, Java_marks, Python_marks, total_marks, percentage) VALUES (?, ?, ?, ?, ?, ?)";
            db.query(insertSql, [student_id, DBMS_marks, Java_marks, Python_marks, total, percentage.toFixed(2)], (e, r) => {
                if (e) return resp.status(500).send({error: "Insert failed"});
                resp.status(201).send({message: "Marks Added Successfully!"});
            });
        }
    });
});

app.listen(4000);

