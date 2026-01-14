import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
		blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
	
	name: {
	type:String,
	required: true,
},

	username:{
		
		type:String,
		required:true,
		unique:true,
	},
	email:{
		
		type:String,
		required:true,
		unique:true
	},
	
	password:{
		
		type:String,
		minLength: 6,
		required:true,
	},
	
	person: {
		type: String,
		enum: ['private', 'organization'],
		default: 'private'
	},

	phone: {
		type: String,
		required: true
	},
	
	profilePic:{
		
		type:String,
		default: "",
	},
	
	profilePicture: {
		type: String,
		default: ""
	},
	
	// Password reset fields
	passwordResetToken: {
		type: String
	},
	
	passwordResetExpires: {
		type: Date
	},
	
	followers:{
		
		type:[String],
		default: [],
		
	},
	
	following:{
		
		type:[String],
		default:[""]
	},
	
	bio:{
		
		type:String,
		max: 500
	},
	
	wishlist: {
		type: [mongoose.Schema.Types.ObjectId],
		ref: 'Dog',
		default: []
	},
	
	role: {
		type: String,
		enum: ['user', 'admin', 'superadmin'],
		default: 'user'
	},
	
	// ...existing code...
	
	
		// timestamps:true
	
	
});

const User = mongoose.model("User", userSchema);

export default User;