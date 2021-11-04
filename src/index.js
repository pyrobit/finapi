const express = require('express');
const { v4: uuidv4} = require('uuid');

const app = express();

// middleware
app.use(express.json());

const customers = [];

// Middleware
function verifyIfExistsAccountCPF(request, response, next) {
    const {cpf} = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf); // returns the customer object with cpf value

    if(!customer) {
        return response.status(400).json({error: "Customer not found"});
    }

    request.customer = customer;

    return next();
}



// Account creation
/**
 * cpf -string
 * name -string
 * id -uuid
 * statement[]
 */
app.post('/account', (request, response) => {
    const {cpf, name} = request.body;


    const customerAlreadyExists = customers.some( // some informs if exists such a value
        (customer) => customer.cpf === cpf
    );

    if(customerAlreadyExists) {
        return response.status(400).json({error: "Customer already exists!"});
    }

    const id = uuidv4();

    customers.push({
        cpf, 
        name,
        id, // id: uuidv4(),
        statement: [],
    });

    return response.status(201).json({
        cpf,
        name,
        id
       
    });

});


app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
    const { cpf } = request.headers;
    const { customer } = request;  // receive customer ffrom middleware verifyIfExistsAccountCPF
    // const customer = customers.find(customer => customer.cpf === cpf); 

    // if(!customer) {
    //     return response.status(400).json({error: "Customer not found"});
    // }

    return response.json(
        customer.statement
    );
});

app.listen(3333);