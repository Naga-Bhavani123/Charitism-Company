let mongoose = require("mongoose")

let todoschema = mongoose.Schema({
    username: {type: String, required: true}, 
password: {type:String, required: true}, 
name: {type: String,
required: true}, 
todoItems: {type: Array, default: []}
})


module.exports = mongoose.model("User", todoschema )