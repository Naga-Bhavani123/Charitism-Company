let express = require("express")
let {compare, hash} = require("bcrypt")
let app = express()
app.use(express.json())
let User = require("./model") // importing model
let {sign, verify} = require("jsonwebtoken")

//authentication check

const authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    //console.log(authHeader)
    if (authHeader !== undefined) {
      jwtToken = authHeader.split(" ")[1];
      //console.log(jwtToken)
    }
    if (jwtToken === undefined) {
      response.status(401);
      response.send("Invalid JWT Token");
    } else {
      verify(jwtToken, "SECRETE_KEY", async (error, payload) => {
        if (error) {
          response.status(401);
          response.send("Invalid JWT Token");
        } else {
          request.username = payload.username
          next();
        }
      });
    }
  }; 

let mongo = require("mongoose")

let url = "mongodb+srv://nagabhavani34:Nagabhavani123@cluster0.fg0xeq2.mongodb.net/nagabhavani34?retryWrites=true&w=majority"
//connection to mongo db cluster
mongo.connect(url).then(() => {
    console.log("db is connected")
}).catch((err) => {
    console.log(err.message)
})
app.listen(3090, () => {
        console.log("server is started")
})


let cat = ["WORK", "HOME", "LEARNING"];
let stat = ["TO DO", "IN PROGRESS", "DONE"];
let prior = ["HIGH", "MEDIUM", "LOW"];

//data checking
let checkingData = (request, response, next) => {
    console.log(request.method)
    let category;
    let priority;
    let status;
    if (request.method === "PUT"){ 
        category = request.body.category;
        priority = request.body.priority
        status = request.body.status
    }else{
       category = request.query.category;
       priority = request.query.priority;
       status = request.query.status
    }
   
    let condition = true;
    if (condition){
      if (priority !== undefined){
        console.log(priority)
        if (prior.includes(priority)) {
          condition = true;
        } else {
          condition = false;
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      }}
    if (condition){
    if (status !== undefined){
            console.log(status);
            if (stat.includes(status)) {
            condition = true;
            } else {
            condition = false;
            response.status(400);
            response.send("Invalid Todo Status");
            }
    }
    }

    if (condition){
        if(category !== undefined){
        if (cat.includes(category)) {
            console.log(category)
            condition = true;
        } else {
            condition = false;
            response.status(400);
            response.send("Invalid Todo Category");
        }
        }

        
    }
  if (condition) {
    next();
  }
};



//registering the user

app.post("/register/", async(request, response) => {
    try{
        let obj = await User.find() 

        let {username, password, name} = request.body;

        let userName = obj.find((object) => {
            return object.username === username
        })

        if (userName === undefined){

            console.log(password.length)
            if (password.length >= 5){
            password = await hash(password, 10)
            console.log(password)
            let obj = new User({username: username, password:password, name:name})
            await obj.save()
            response.send("Data is updated")
            } else{
                response.send("Password is too short")
            }
        } else{
            response.send("User already registered")
        }
    } catch(err){

        console.log(err.message)
    }

       
})

//user login API

app.post("/login/", async (request, response) => {

    try{
        let obj = await User.find() 

        let {username, password} = request.body;

        let userName = obj.find((object) => {
            return object.username === username
        })
        if (userName !== undefined){
                let iscorrect = compare(password, userName.password)
                if (iscorrect){
                    let token = sign({username: username}, "SECRETE_KEY")
                    response.send({token})
                }else{
                    response.send("Incorrect Password")
                }
        }else{
            response.send("Invalid User")
        }

    } catch(err){
        console.log(err.message)
    }
})


//User data
app.get("/user/", authenticateToken, async (request, response) => {
    console.log(request.username)
    let obj = await User.find({username: {$eq: request.username}})
    response.send(obj)
})

//Getting user todod based on certeria

app.get("/user/todo", authenticateToken, checkingData, async (request, response) => {
    
    let {todo ="", category = "", priority ="", status = ""} = request.query
    let object = await User.find({username: {$eq: request.username}}, {todoItems:1});
    //console.log(object)
    if (object.lenght !== 0){
    object = object[0].todoItems
    let obj;
    console.log(todo)
    if (todo !== ""){
        obj = object.filter((todoI) => {
                return todoI.todo === todo
        })
    }else if (category !== ""){
        obj = object.filter((todoI) => {
            return todoI.category === category
        })
    }else if (priority !== ""){
        obj = object.filter((todoI) => {
            return todoI.priority === priority
        })
    }else if (status !== ""){
        //console.log(todo)
        obj = object.filter((todoI) => {
            return todoI.status === status
        })       
    }else{
        obj = object
    }
    response.send(obj)
} else{
    response.send("User Deleted")
}
})

//pushing the new todo item with push operator from update method

app.put("/user/todo/", authenticateToken, checkingData, async (request, response) => {
    try{
        let todo = request.body.todo
        let obj = await User.find({$and: [{username: {$eq: request.username}}, {"todoItems.todo": {$eq: todo}}]})
        console.log(obj)
        if (obj.lenght !== 0){
        let data = await User.updateMany({username: {$eq :request.username}}, {$push: {todoItems: request.body}})
        //console.log(JSON.stringify(await User.find()))
        response.send("Data got updated")
        }else{
            response.status(400)
            response.send("Todo already defined")
        }
    }catch (err){
        response.status(400)
        response.send(err.message)
    }
})


//deleting the user

app.delete("/user/",authenticateToken, async (request, response) => {
    try{
        let obj = await User.deleteMany({username: {$eq: request.username}})
        //await obj.remove()
        response.send("User get deleted")
    }catch(err){
        response.send(err.message)
    }
})

//pulling the todo based on creteria

app.put("/user/todo/delete/",authenticateToken, checkingData, async (request, response) => {
    try{
        let {todo ="", category = "", priority ="", status = ""} = request.query
        console.log(status)
    let obj;
    if (todo !== ""){
        obj = await User.updateMany({username: {$eq: request.username}}, {$pull: {"todoItems":{todo : {$eq: todo}}}})
    }else if (category !== ""){
        obj = await User.updateMany({username: {$eq: request.username}}, {$pull: {"todoItems":{category : {$eq: category}}}})
    }else if (priority !== ""){
        obj = await User.updateMany({username: {$eq: request.username}}, {$pull: {"todoItems":{priority : {$eq: priority}}}})
    }else if (status !== ""){
        obj = await User.updateMany({username: {$eq: request.username}}, {$pull: {"todoItems":{status : {$eq: status}}}})
    }
        //await obj.remove()
    response.send("User todo get deleted")
    }catch(err){
        response.send(err.message)
    }
})