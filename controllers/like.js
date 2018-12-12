const Like = require('../models/like')
const Post = require('../models/post')
const User = require('../models/user')
const Collect = require('../models/collect')
const likes = async (ctx)=>{
    let username = ctx.params.username;
    let currentUser  = ctx.session.userinfo;
    let user = await User.get(username)
    if(!user){
        ctx.flash={ error: '用户不存在' };
        return ctx.redirect('/')
    }
    let likes = await Like.get(username)
    let liked_posts = []
    for(let i = 0; i< likes.length; i++){
        let id = likes[i].likeable_id
        let post = await Post.findOne(id)
        if(currentUser){
            let collect = await Collect.getOne({collectable_id:id,user: currentUser.username})
            if(collect){
                Object.assign(post,{collect_id: collect.collect_id})
            }
        }
        if(post){
            Object.assign(post,{like_id:likes[i].like_id})
            liked_posts.unshift(post)
        }
    }
    let myPosts = await Post.get(username);
    await ctx.render('like_frame',{
        posts: liked_posts,
        posts_count: myPosts.length,
        username: username
    })
}
const like = async (ctx)=>{
    let likeable_id = ctx.request.body.likeable_id;
    let liked
    if (likeable_id.length == 24){
        let post = await Post.findOne(likeable_id)
        if(post){
            liked = post.liked
            liked++
        }else{
            ctx.body = {success: false};
            return
        }
    }else{
        ctx.body = {success: false};
        return
    }
    let currentUser  = ctx.session.userinfo;
    let result = await Post.update(likeable_id,{liked})
    let like_id=0;
    let likes = await Like.get()
    for(let i = 0; i< likes.length; i++){
        let id = likes[i].like_id;
        if(id>like_id){
            like_id = id
        }
    }
    like_id++
    let like = new Like(currentUser.username,likeable_id,like_id)
    let liked_result = await like.save()
    if (liked_result.result.n == 1 && result.result.n == 1){
        ctx.body =  {success: true,
                     liked,
                     like_id}
    }else{
        ctx.body = {success: false};
        return;
    }

}
const not_like = async (ctx)=>{
    let like_id = ctx.request.body.like_id;
    let likeable_id = ctx.request.body.likeable_id
    let liked
    if (likeable_id.length == 24){
        let post = await Post.findOne(likeable_id)
        let liked_post = await Like.findOne(like_id)
        if(post && liked_post){
            liked = post.liked
            liked--
        }else{
            return ctx.status = 500;
        }
    }else{
        ctx.body = {success: false};
        return;
    }
    let result = await Post.update(likeable_id,{liked})
    let not_liked_result = await Like.remove(like_id)
    if (result.result.n == 1 && not_liked_result.result.n == 1){
        ctx.body = {
            success: true,
            liked
        }
    }else{
        ctx.body = {success: false};
        return;
    }
}
module.exports={
    'GET /like/:username': likes,
    'POST /like': like,
    'POST /not_like': not_like
}