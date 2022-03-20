const { response } = require('express');
const express = require('express');
const {v4: uuidv4} = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistsAccountCpf(req, res, next){
  const {cpf} = req.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if(!customer) { 
    return res.status(400).json({error: "Customer not found"})
  }

  req.customer = customer;

  return next();
};

function getBalance(statement) {
 const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit'){
      return acc + operation.amount;
    }else{
      return acc - operation.amount
    }
  }, 0)

  return balance;
};

app.post('/account', (request, response) => {
  const {cpf, name} = request.body;

  const customersAlreadyExists = customers.some((customer) => customer.cpf === cpf)

  if(customersAlreadyExists) {
    return response.status(400).json({ error: "Customer already exists"})
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return response.status(200).send();

});

//Modo de usar o middleware em todas as rotas seguintes.
//app.use(verifyIfExistsAccountCpf);

app.get('/statement', verifyIfExistsAccountCpf, (req, res) => {
  const { customer } = req;

  return res.json(customer.statement);

});

app.post('/deposit', verifyIfExistsAccountCpf, (req, res) => {
  const { description, amount } = req.body;
  
  const {customer} = req;

  const statemantOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statemantOperation)

  return res.status(201).send();
});

app.post('/withdraw', verifyIfExistsAccountCpf, (req, res) => {
  const {amount} = req.body;
  const {customer} = req;

  const balance = getBalance(customer.statement);

  if(balance < amount) {
    return res.status(400).json({error: 'Insufficient founds'})
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.get('/statement/date', verifyIfExistsAccountCpf, (req, res) => {
  const { customer } = req;
  const { date } = req.query;
  
  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date
  (dateFormat).toDateString());

  return res.json(statement);

});

app.put('/account', verifyIfExistsAccountCpf, (req, res) => {
  const { name } = req.body;  
  const { customer } = req;

  customer.name = name;

  return res.status(201).send();
})

app.get('/account', verifyIfExistsAccountCpf, (req, res) => {
  const { customer } = req;

  return res.json(customer);
})

app.delete('/account', verifyIfExistsAccountCpf, (req, res) => {
  const { customer } = req;

  customers.splice(customer, 1);

  return res.status(200).json(customers);
})

app.get('/balance', verifyIfExistsAccountCpf, (req, res) => {
  const {customer} = req;

  const balance = getBalance(customer.statement);

  return res.json(balance);
})

app.listen(3333, () => console.log('Server On'));