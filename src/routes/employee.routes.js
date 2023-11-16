const express = require('express');
const router = express.Router();
const DB = require('../db');
const { updateSalary } = require('../db/employees.db');

/**
 * Middleware para verificar que existe el departamento con parámetro id
 * @param {Request} req 
 * @param {Response} res 
 * @param {Function} next 
 * @returns 
 */

async function checkEmployee(req,res,next){
    const employe = await DB.Employees.getById(req.params.id)
    if(!employe){
        return res.status(404).send("Empleado no existente")
    }
    res.locals.employe=employe;
    next();
}
///api/v1/employees/
router.get('/',async (req,res)=>{
    const deptos = await DB.Employees.getAll();    
    res.status(200).json(deptos)
});
///api/v1/employees
router.get('/:id',checkEmployee,(req,res)=>{
    res.status(200).json(res.locals.employe)
})
///api/v1/employees
router.get('/:id/salary',checkEmployee,async (req,res)=>{
    const employee = await DB.Employees.getActualSalario(res.locals.employe);
    res.status(200).json(employee)
})
///api/v1/employees
router.put('/:id/updateSalary',checkEmployee,async (req,res)=>{
    const {reqSalary} = req.body;
    if(!reqSalary){
        res.status(400).send('Salario a modificar requerido');
        return
    }
    const employee = res.locals.employe;
    const isUpdateOk = await updateSalary(employee,reqSalary);
    if(isUpdateOk==1){ 
        res.status(400).send('Ya se modifico el salario de este empleado la fecha hoy')
        return}
    if(isUpdateOk==0){
            res.status(400).send("El empleado no trabaja actualmente")
            return
    }
    if(isUpdateOk!=='undefined'){
        res.status(200).send(`El salario del empleado ${employee.emp_no} se modifico en ${reqSalary}`)
        return
    }
    else{
        res.status(500).send('No se pudo modificar el salario')
        return
    }
})
///api/v1/employees
router.put('/:id/moverempleado',checkEmployee, async (req, res)=>  {
    const {dpto_no} =req.body
    const employee = res.locals.employe
    if(!dpto_no){
        res.status(400).send('Ingrese el departamento de destino')
    }
    const isUpdateOk = await DB.Employees.moverEmpleado(employee,dpto_no);
    if(isUpdateOk==1){
        res.status(201).send(`El empleado ${employee.emp_no} ya se encuentra el el departamentor ${dpto_no}`)
        return
    }
    if(isUpdateOk==0){
        res.status(400).send("El empleado no trabaja actualmente")
        return
    }else{
        if(isUpdateOk){
            res.status(200).send(`Se movio el empleado ${employee.emp_no} al deparmento ${dpto_no}`)
        }else{
            res.status(500).send('Fallo al mover el empleado')
        }
    }

})

module.exports=router