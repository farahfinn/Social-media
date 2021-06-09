//get user id using the context

const user_id = JSON.parse(document.getElementById('user_id').textContent)

// when navbar items are clicked 
document.querySelector('#all_posts').addEventListener('click', () => showPostsPage());
if (user_id != null){
    document.querySelector('#profile').addEventListener('click', () => showProfilePage(user_id));
    document.querySelector('#following').addEventListener('click', () => followingPosts(1));

}

//by default show all posts
showPostsPage()


function showPostsPage () {
    document.querySelector('#profile_page').style.display = 'none';
    document.querySelector('#posts_page').style.display = 'block';
    document.querySelector('#pagination').style.display = 'block';
    
    //empty the posts list
    document.querySelector('#posts').innerHTML = ''
    // show the first page posts
    getPosts(1)
}

function showProfilePage(id){
    //show the profile page and hide other pages
    document.querySelector('#posts_page').style.display = 'none';
    document.querySelector('#pagination').style.display = 'none';
    document.querySelector('#profile_page').style.display = 'block';
    
    fetch(`/profile/${parseInt(id)}`)
    .then(response => response.json())
    .then(data => {
        // the fetch returns a data object (dictionary) with posts and info as key value pairs
        // use the info from the data dictionary to show profile info
        document.querySelector('#username_display').innerHTML = `${data.info[0].username}`
        document.querySelector('#info').innerHTML =`<div class="d-flex flex-column"> <span class="follows">Follows</span> <span class="number1">${data.info[0].following_count}</span> </div>
                                                    <div class="d-flex flex-column"> <span class="followers">Followers</span> <span class="number2">${data.info[0].followers_count}</span> </div>`
        followDisplay(data.info[0].username,data.info[0].followers)
        // use the posts to
        displayPosts(data.posts)
    })
}

//how to get csrf token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const NewPostForm = document.querySelector('#new_post')
// when the posts form is submitted
if (NewPostForm) {
    NewPostForm.onsubmit = function() {
        fetch('/new_post', {
        method: 'POST',
        headers: {
            "X-CSRFToken": getCookie("csrftoken")  
        },
        credentials: "same-origin",
        body: JSON.stringify({
            body: document.querySelector('#body').value
        })
        })
        .then(response => response.json())
        .then(result => {
            location.reload();
        });
        // Prevent default submission
        return false;
    }
}

function getPosts(page) {
    fetch ('all_posts/'+ page)
    .then(response => response.json())
    .then(data => {
        displayPosts(data.posts)
        pagination(data.has_previous, data.pages, data.has_next, data.next_page_num, data.prev_page_num, data.current_page)
        console.log(data)
    })
    
}

function displayPosts(posts) {
    const currentUser = JSON.parse(document.getElementById('username').textContent)
    // clear out posts div  first
    document.querySelector('#posts').innerHTML = ''
    posts.forEach( (post,index) => {
        let liked
        for (let i = 0; i < posts[index].likes.length; i++){
            if (currentUser == posts[index].likes[i]){
                liked = true
            }else{
                liked = false
            }
        }
        // create posts div and fill it
        const item = document.createElement('div')
        item.setAttribute('id', post.id)
        item.setAttribute('class', 'card w-85')
        item.innerHTML =`<div class="card-body">
                            <a href= "#"><h5 class="card-title ${post.author}">${post.author}</h5></a>
                            <p class="card-text">${post.body}</p>
                            <p class="text-muted">${post.created_on}</p>
                        </div>
                        <div class="card-footer">
                            <a href="javascript:void()" class="card-link" id = "like${post.id}"><i class="bi bi-hand-thumbs-up"></i>${liked ? `Unlike`: `Like`}</a>
                            <span id ="like${post.id}span"> ${posts[index].likes.length} likes</span>
                            ${post.author == currentUser ? `<a href="#" class="card-link" id = "edit${post.id}" data-toggle="modal" data-target="#exampleModal"><i class="bi bi-chat-left"></i>Edit Post</a>` : ``} 
                        </div>`
        // populate div with posts
        document.querySelector('#posts').append(item)
        //add click event listener for when the author username, like and edit are clicked
        document.querySelector(`.${post.author}`).addEventListener('click',() => showProfilePage(post.author_id))
        document.querySelector(`#like${post.id}`).addEventListener('click', ()=> likeUnlike(post.id))
        if (document.querySelector(`#edit${post.id}`) != null){
            document.querySelector(`#edit${post.id}`).addEventListener('click', () => modalDisplay(post.id,post.body))
        }
    })
}


function followDisplay(name,list){
    //don't show if current user = to the profile being shown
    const currentUser = JSON.parse(document.getElementById('username').textContent)
    

    if (currentUser === name){
        document.querySelector('#follow').innerHTML = ``
    }
    else if (list.includes(currentUser)) {
        // console.log('list is ' + list)
        // console.log(currentUser +' in list')
        document.querySelector('#follow').innerHTML = `<button class="btn btn-sm btn-primary w-50 ml-2" id="follow_button">UnFollow</button>`
        document.querySelector('#follow_button').addEventListener('click', ()=> toggleFollowUnfollow(name))
    }
    else {
        // console.log('list is ' + list)
        // console.log(currentUser +' not in list')
        document.querySelector('#follow').innerHTML = `<button class="btn btn-sm btn-primary w-50 ml-2" id="follow_button">Follow</button>`
        document.querySelector('#follow_button').addEventListener('click', ()=> toggleFollowUnfollow(name))
    }
}

function toggleFollowUnfollow(name){
    fetch(`follow`, {
        method : 'PUT',
        headers: {
            "X-CSRFToken": getCookie("csrftoken")  
        },
        credentials: "same-origin",
        body: JSON.stringify({
            username : name
        })
    })
    location.reload()
}

// function contains(list, obj) {
//     var i = list.length;
//     while (i--) {
//        if (list[i] === obj) {
//            return true;
//        }
//     }
//     return false;
// }

// getting the posts of ppl the current user follows use it in the click event listener for link in nav

function followingPosts(page) {
    document.querySelector('#profile_page').style.display = 'none';
    fetch (`following/` + page)
    .then(response => response.json())
    .then(data => {
        console.log(data)
        displayPosts(data.posts)
        pagination(data.has_previous, data.pages, data.has_next, data.next_page_num, data.prev_page_num, data.current_page)
    })
}

function modalDisplay(id,body){
    document.querySelector(".modal-body").innerHTML =`<textarea class="form-control" autofocus type="text" name="body" id="edit_body" rows="3">${body}</textarea>`
    document.querySelector("#edit_post").addEventListener('click', ()=> editPost(id))
}

function editPost(id){
    fetch(`edit/${parseInt(id)}`, {
        method: 'PUT',
        headers: {
            "X-CSRFToken": getCookie("csrftoken")  
        },
        credentials: "same-origin",
        body: JSON.stringify({
            body : document.querySelector("#edit_body").value
        })
    })
    $('#exampleModal').modal('toggle')
    location.reload()
}

function pagination(previous, pages, next, next_page_num, prev_page_num, current_page){
    document.querySelector('#pagination').style.display = 'block';
    document.querySelector('#pagination').innerHTML =`<nav aria-label="Page navigation example">
                                                        <ul class="pagination">
                                                        ${previous ? `<li class="page-item"><a class="page-link" href="#" onclick= "getPosts(${prev_page_num})">Previous</a></li> <li class="page-item"><a class="page-link" href="#" onclick= "getPosts(${current_page - 1})">${current_page - 1}</a></li>`: ``}
                                                        <li class="page-item active" aria-current="page"><a class="page-link" href="#" onclick= "getPosts(${current_page})">${current_page} <span class="sr-only">(current)</span></a></li>    
                                                        ${next ? `<li class="page-item"><a class="page-link" href="#" onclick= "getPosts(${current_page + 1})">${current_page + 1}</a></li> <li class="page-item"><a class="page-link" href="#" onclick= "getPosts(${next_page_num})">Next</a></li>`: ``}
                                                        </ul>
                                                    </nav>`
}

function likeUnlike(id){
    fetch(`edit/${parseInt(id)}`, {
        method: 'PUT',
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        },
        credentials : "same-origin",
        body: JSON.stringify({
            like: parseInt(id)
        })
    }).then(response => response.json())
    .then(data =>{
        const currentUser = JSON.parse(document.getElementById('username').textContent)
        let liked = false
        for (let i = 0; i < data.likers.length; i++){
            if (currentUser == data.likers[i]) {
                liked = true
            }  
        }
        
        document.querySelector(`#like${id}span`).innerHTML = `${data.likers.length} likes`
        document.querySelector(`#like${id}`).innerHTML = `${liked ? `Unlike`: `Like`}`

    })
}
