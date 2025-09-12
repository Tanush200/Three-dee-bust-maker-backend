
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')


const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar : {
        type : String,
        default : null
    },
    subscription:{
        type:String,
        enum:['free','premium','pro'],
        default :'free'
    },
    credits:{
        type:Number,
        default:3
    },
    isActive:{
        type:Boolean,
        default:true
    }
  },
  { timestamps: true }
);


UserSchema.pre('save',async function (next) {
    if(!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password,salt);
        next();
    } catch (error) {
        next(error)
    }

})

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};



module.exports = mongoose.model('User',UserSchema)