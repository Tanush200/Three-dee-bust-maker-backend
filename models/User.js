
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')


const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\\S+@\\S+\\.\\S+$/, "is invalid"],
  },
   password: {
    type: String,
    required: true,
    minlength: 8
   },

},{timestamp: true});


UserSchema.pre('save',async function (next) {
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password,10)
    next();

})

UserSchema.methods.comparePassword = function (candidate){
    return bcrypt.compare(candidate,this.password);

}



module.exports = mongoose.model('User',UserSchema)