const { response } = require('express');
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


function getBalance(statement) {
    const balance = statement.reduce((accumulator, operation) => {
        if(operation.type === 'credit') {
            return accumulator + operation.amount;

        } else {
            return accumulator - operation.amount;
        }

    }, 0); // 0 as initial value to start reduce

    return balance;
}


// Account creation
/**
 * cpf -string
 * name -string
 * id -uuid
 * statement[]
 */
// create account
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


// get statement
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

// deposit
app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {

    const {description, amount } = request.body;

    const {customer} = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();


});

// withdraw
app.post('/withdraw', verifyIfExistsAccountCPF,(request,response) => {
    const { amount } = request.body; // withdraw value
    const { customer} = request;
    balance = getBalance(customer.statement);

    if( balance < amount) {
        return response.status(400).json({ error: "Insuficient funds!" });
    }

    const statementOperation = {
        description: "withdraw",
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();


});

// Statement by date
app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;  // receive customer ffrom middleware verifyIfExistsAccountCPF
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00"); // hack to enable search by Day
console.log(dateFormat);
    const statement = customer.statement.filter(
        (statement) => 
            statement.created_at.toDateString() === 
            new Date(dateFormat).toDateString() 
    );


    return response.json(
        statement        
    );
});

// update account
app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body; 
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
});

// get account data
app.get('/account', verifyIfExistsAccountCPF,(request, response) => {
    const { customer} = request;
    return response.json(customer);

});

// delete account
app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { customer} = request;

    // splice
    customers.splice(customer, 1); // removes only the position where customer is

    return response.status(204).json(customers);

});

// return balance
app.get('/balance', verifyIfExistsAccountCPF, (request,response) => {
    const { customer } = request;
    const balance = getBalance(customer.statement);

    return response.json(balance);
});

app.listen(3333);