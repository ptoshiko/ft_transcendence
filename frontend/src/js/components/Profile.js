import { navigateTo, redirectTo } from "../helpers.js";
import {
    getFriends,
    getMe,
    getUserByDisplayName,
    uploadAvatar,
    updateInfo,
    unblockUser,
    sendFriendRequest, blockUser, approveFriendRequest, getFriendsOfUser, removeFriend
} from "../service/users.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }
    
    async connectedCallback() {
        // Checking if user exists, otherwise - 404 page
        this.user = await getUserByDisplayName(this.getAttribute("username"));
        if (!this.user) {
            this.innerHTML = `<tr-not-found><tr-not-found>`
            return;
        }

        this.render(this.user.username, this.user.email);
        this.avatar.setAttribute("src", this.user.avatar);

        this.initAvatarChangeComponents();
        this.initInfoChangeComponents();

        if (this.user.is_me > 0) {
            this.avatarEditIcon.style.display = "inline-block";
            this.profileEditInfoBtn.style.display = "inline-block";
        } else {
            this.initStatusBadge();
        }

        this.renderSmallFriendsList();

        document.title = "Profile";
    }

    render() {
        this.innerHTML = `
            <tr-nav></tr-nav>
            <div class="container">
            <!-- First Row -->
            <div class="row mt-3">
                <!-- Avatar -->
                <div style="position: relative;" class="col-6">
                    <img id="profile-avatar" class="d-block m-auto rounded-circle" width="200" height="200" alt="avatar">
                    <div id="profile-status-badge"></div>
                    <a data-toggle="modal" data-target="#change-avatar-modal" href="#" style="position: absolute; top:0; right:0;"><i style="display:none;" id="profile-image-edit-icon" class="fa-solid fa-pencil"></i></a>
                    <button style="display: none;" id="send_friend_request_btn" class="btn btn-success">Send Friend Request</button>
                    <button style="display: none;" id="approve_friend_request_btn" class="btn btn-success">Approve Friend Request</button>
                    <button style="display: none;" id="remove_friend_btn" class="btn btn-danger">Remove Friend</button>
                    <button style="display: none;" id="block_btn" class="btn btn-danger">Block</button>
                    <button style="display: none;" id="unblock_btn" class="btn btn-warning">Unblock</button>
                </div>
                <!-- Info -->
                <div class="col-6">
                    <div class="card h-100">
                        <h5 class="card-header">Personal Info</h5>
                        <div class="card-body">
                            <h5 class="card-title">${this.user.display_name}</h5>
                            <p class="card-text"><i class="fa-solid fa-envelope mr-1"></i>${this.user.email}</p>
                            <a data-toggle="modal" data-target="#edit-info-modal" id="profile-edit-info-btn" style="display:none;" href="#" class="btn btn-primary">Edit</a>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Second Row -->
            <div class="row mt-3">
                <!-- Stats -->
                <div class="col-6">
                    <div class="card h-100">
                        <h5 class="card-header">Stats</h5>
                        <div class="card-body">
                            <h5 class="card-title text-success">Wins: 5</h5>
                            <h5 class="card-title text-danger">Loses: 6</h5>
                        </div>
                    </div>
                </div>
                <!-- Friends -->
                <div class="col-6">
                    <div class="card h-100">
                        <h5 class="card-header">Friends</h5>
                        <div id="profile-small-friends-list" class="list-group list-group-flush"></div>  
                        <div class="card-body">
                            <h2 id="no-friends-title" style="display: none">You don't have friends yet 😭</h2>
                            <a id="profile-view-all-friends-btn" style="display: none" href="#" class="btn btn-primary" data-toggle="modal" data-target="#view-all-friends-modal">View All</a>
                        </div>  
                    </div>
                 </div>
            </div>
    
            <!-- Third row -->
            <div class="row mt-3">
                <!-- Matches -->
                <div class="col-6">
                    <div class="card">
                        <h5 class="card-header">Match History</h5>
                        <div class="card-body">
                            <h5 class="card-sub-title bg-success text-white p-2">@ptoshiko - You won</h5>
                            <h5 class="card-sub-title bg-danger text-white p-2">@smaar - You lost</h5>
                            <h5 class="card-sub-title bg-danger text-white p-2">@dk2la - You lost</h5>
                            <a href="#" class="btn btn-primary">View All</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Info Modal -->
        <div class="modal fade" id="edit-info-modal" tabindex="-1" role="dialog" aria-labelledby="edit-info-modal" aria-hidden="true">
            <div class="modal-dialog modal-dialog-scrollable" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Info</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form>
                            <div class="form-group">
                                <label for="profile-edit-display-name-input">Edit Display Name</label>
                                <input type="text" class="form-control" id="profile-edit-display-name-input" placeholder="Edit Display Name">
                                <div id="profile-invalid-display-name-feedback" class="invalid-feedback"></div>
                            </div>
                            <div class="form-group">
                                <label for="profile-edit-email-input">Edit Email</label>
                                <input type="email" class="form-control" id="profile-edit-email-input" placeholder="Edit Email">
                                <div id="profile-invalid-email-feedback" class="invalid-feedback"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button id="profile-update-info-btn" type="button" class="btn btn-success" disabled>Save Changes</button>
                        <button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- View All Friends Modal -->
        <div class="modal fade" id="view-all-friends-modal" tabindex="-1" role="dialog" aria-labelledby="view-all-friends-modal" aria-hidden="true">
            <div class="modal-dialog modal-dialog-scrollable" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Friends</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="profile-big-friends-list" class="list-group list-group-flush"></div>  
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal To Change Avatar-->
        <div class="modal fade" id="change-avatar-modal" tabindex="-1" role="dialog" aria-labelledby="change-avatar-modal" aria-hidden="true">
        <div id="profile-wrong-avatar-format-alert" class="alert alert-danger collapse" role="alert">
            We accept only <b>JPEG</b> fomat for avatars
        </div>
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Change Avatar</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div>
                        <div class="mb-4 d-flex justify-content-center">
                            <img id="profile-change-avatar-preview" src="https://mdbootstrap.com/img/Photos/Others/placeholder.jpg"
                             class="rounded-circle" width="200" height="200" />
                        </div>
                        <div class="d-flex justify-content-center">
                            <div data-mdb-button-init data-mdb-ripple-init class="btn btn-primary btn-rounded">
                                <label class="form-label text-white m-1" for="change-avatar-input">Choose file</label>
                                <input type="file" class="form-control d-none" id="change-avatar-input"/>
                            </div>
                        </div>
                    </div>                
                </div>
                <div class="modal-footer">
                    <button id="profile-accept-avatar-change-btn" style="display: none;" type="button" class="btn btn-success" data-dismiss="modal">Change</button>
                    <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>
        `;

        // Avatar
        this.avatar = this.querySelector("#profile-avatar");
        this.avatarEditIcon = this.querySelector("#profile-image-edit-icon");

        // Status and Action Buttons
        this.profileStatusBadge = this.querySelector("#profile-status-badge");
        this.sendFriendReqBtn = this.querySelector("#send_friend_request_btn");
        this.approveFriendReqBtn = this.querySelector("#approve_friend_request_btn");
        this.removeFriendBtn = this.querySelector("#remove_friend_btn");
        this.blockBtn = this.querySelector("#block_btn");
        this.unblockBtn = this.querySelector("#unblock_btn");

        this.profileEditInfoBtn = this.querySelector("#profile-edit-info-btn");
        this.profileSmallFriendsList = this.querySelector("#profile-small-friends-list");
        this.changeAvatarInput = this.querySelector("#change-avatar-input");
        this.profileChangeAvatarPreview = this.querySelector("#profile-change-avatar-preview");
        this.profileAcceptAvatarChangeBtn = this.querySelector("#profile-accept-avatar-change-btn");

        // Friends Info
        this.noFriendsTitle = this.querySelector("#no-friends-title");
        this.profileViewAllFriendsBtn = this.querySelector("#profile-view-all-friends-btn");
        this.profileBigFriendsList = this.querySelector("#profile-big-friends-list");

        // Update Info
        this.profileEditEmailInput = this.querySelector("#profile-edit-email-input");
        this.profileEditDisplayNameInput = this.querySelector("#profile-edit-display-name-input");
        this.profileInvalidEmailFeedback = this.querySelector("#profile-invalid-email-feedback");
        this.profileInvalidDisplayNameFeedback = this.querySelector("#profile-invalid-display-name-feedback");
        this.profileUpdateInfoBtn = this.querySelector("#profile-update-info-btn");
    }

    initStatusBadge() {
        this.sendFriendReqBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await sendFriendRequest(this.user.id);
            this.user = await getUserByDisplayName(this.user.display_name);
            this.initStatusBadge(this.user);
        });
        this.blockBtn.addEventListener('click', async (e) => {
           e.preventDefault();
            await blockUser(this.user.id);
            this.user = await getUserByDisplayName(this.user.display_name);
            this.initStatusBadge(this.user);
        });
        this.unblockBtn.addEventListener('click', async (e) => {
           e.preventDefault();
           await unblockUser(this.user.id);
           this.user = await getUserByDisplayName(this.user.display_name);
           this.initStatusBadge(this.user);
        });
        if ((this.user.blocked_me === true && this.user.is_blocked_by_me === true) || this.user.is_blocked_by_me === true ) {
            this.profileStatusBadge.innerHTML = `<span class="badge badge-pill badge-danger" style="position: absolute; top:0; right:0;">Blocked</span>`
            this.unblockBtn.style.display = "inline-block";
            this.blockBtn.style.display = "none";
            this.removeFriendBtn.style.display = "none";
            this.sendFriendReqBtn.style.display = "none";
            this.approveFriendReqBtn.style.display = "none";
            return;
        }
        this.approveFriendReqBtn.addEventListener('click', async (e) => {
           e.preventDefault();
            await approveFriendRequest(this.user.id);
            this.user = await getUserByDisplayName(this.user.display_name);
            this.initStatusBadge(this.user);
        });

        this.removeFriendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await removeFriend(this.user.id);
            this.user = await getUserByDisplayName(this.user.display_name);
            this.initStatusBadge(this.user);
        });

        if (this.user.blocked_me === true) {
            this.profileStatusBadge.innerHTML = `<span class="badge badge-pill badge-danger" style="position: absolute; top:0; right:0;">Blocked You</span>`
            this.blockBtn.style.display = "none";
            this.unblockBtn.style.display = "none";
            this.sendFriendReqBtn.style.display = "none";
            this.approveFriendReqBtn.style.display = "none";
            this.removeFriendBtn.style.display = "none";
            return;
        }

        if (this.user.friend_status === "PENDING" && this.user.friend_request_sent_by_me === true) {
            this.profileStatusBadge.innerHTML = `<span class="badge badge-pill badge-primary" style="position: absolute; top:0; right:0;">Pending Friend Request</span>`
            this.blockBtn.style.display = "none";
            this.unblockBtn.style.display = "none";
            this.sendFriendReqBtn.style.display = "none";
            this.approveFriendReqBtn.style.display = "none";
            this.removeFriendBtn.style.display = "none";
            return;
        }

        if (this.user.friend_status === "PENDING" && this.user.friend_request_sent_by_me === false) {
            this.profileStatusBadge.innerHTML = ``;
            this.approveFriendReqBtn.style.display = "inline-block";
            this.blockBtn.style.display = "inline-block";
            this.unblockBtn.style.display = "none";
            this.sendFriendReqBtn.style.display = "none";
            this.removeFriendBtn.style.display = "none";
            return;
        }

        if (this.user.friend_status === "APPROVED") {
            this.profileStatusBadge.innerHTML = `<span class="badge badge-pill badge-success" style="position: absolute; top:0; right:0;">Friend</span>`
            this.blockBtn.style.display = "inline-block";
            this.removeFriendBtn.style.display = "inline-block";
            this.unblockBtn.style.display = "none";
            this.sendFriendReqBtn.style.display = "none";
            this.approveFriendReqBtn.style.display = "none";
            return;
        }

        this.profileStatusBadge.innerHTML = ``;
        this.sendFriendReqBtn.style.display = "inline-block";
        this.blockBtn.style.display = "inline-block";
        this.unblockBtn.style.display = "none";
        this.approveFriendReqBtn.style.display = "none";
        this.removeFriendBtn.style.display = "none";
    }

    async renderSmallFriendsList() {
        $('#view-all-friends-modal').on('hide.bs.modal', (e) => {
            this.profileBigFriendsList.innerHTML = ``;
        });


        this.profileViewAllFriendsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const friends = await getFriendsOfUser(this.user.display_name);
            for (let friend of friends) {
                const friendElement = document.createElement("tr-user-small");
                friendElement.setAttribute("avatar", friend.avatar);
                friendElement.setAttribute("display-name", friend.display_name);
                friendElement.addEventListener('click', e =>{
                    $('#view-all-friends-modal').modal('hide');
                    navigateTo(`/profiles/${friend.display_name}`);
                })
                this.profileBigFriendsList.appendChild(friendElement);
            }
        })

        const friends = await getFriendsOfUser(this.user.display_name, 3, 0);

        if (friends.length <= 0) {
            this.profileSmallFriendsList.innerHTML = ``;
            this.profileViewAllFriendsBtn.style.display = "none";
            if (this.user.is_me) {
                this.noFriendsTitle.style.display = "block";
            }
        } else {
            this.profileViewAllFriendsBtn.style.display = "inline-block";
            for (let friend of friends) {
                const friendElement = document.createElement("tr-user-small");
                friendElement.setAttribute("avatar", friend.avatar);
                friendElement.setAttribute("display-name", friend.display_name);
                this.profileSmallFriendsList.appendChild(friendElement);
            }
        }
    }

    initAvatarChangeComponents() {
        $('#change-avatar-modal').on('hide.bs.modal', (e) => {
            this.profileChangeAvatarPreview.src = "https://mdbootstrap.com/img/Photos/Others/placeholder.jpg";
            this.profileAcceptAvatarChangeBtn.style.display = "none";
            this.fileToUpload = null;
        })

        this.changeAvatarInput.addEventListener('change', (e)=>{
            const fileInput = e.target;

            if (!fileInput.files) {
                return;
            }

            if (!fileInput.files[0]) {
                return;
            }

            if (fileInput.files[0].type !== "image/jpeg") {
                $("#profile-wrong-avatar-format-alert").show();
                setTimeout(()=>{$("#profile-wrong-avatar-format-alert").hide()}, 5000);
                return;
            }

            $("#profile-wrong-avatar-format-alert").hide();

            const reader = new FileReader();

            reader.onload = (e) => {
                this.profileChangeAvatarPreview.src = e.target.result;
            };

            reader.readAsDataURL(fileInput.files[0]);

            this.fileToUpload = fileInput.files[0];

            this.profileAcceptAvatarChangeBtn.style.display = "inline-block";
        })

        this.profileAcceptAvatarChangeBtn.addEventListener('click', (e) => {
            uploadAvatar(this.fileToUpload).then((newAvatar)=>{
                this.avatar.src = newAvatar;
            });
        })
    }

    initInfoChangeComponents() {
        this.profileEditDisplayNameInput.value = this.user.username;
        this.profileEditEmailInput.value = this.user.email;

        this.profileEditDisplayNameInput.addEventListener("input", (e)=>{
            if (this.profileEditDisplayNameInput.value.length > 0 && this.profileEditDisplayNameInput.value != this.user.username) {
                this.profileUpdateInfoBtn.removeAttribute('disabled')
            } else {
                this.profileUpdateInfoBtn.setAttribute('disabled', "");
            }
        });

        this.profileEditEmailInput.addEventListener("input", (e)=>{
            if (this.profileEditEmailInput.value.length > 0 && this.profileEditEmailInput.value != this.user.email) {
                this.profileUpdateInfoBtn.removeAttribute('disabled')
            } else {
                this.profileUpdateInfoBtn.setAttribute('disabled', "");
            }
        });

        $('#edit-info-modal').on('hide.bs.modal', (e) => {
            this.profileEditDisplayNameInput.value = this.user.username;
            this.profileEditEmailInput.value = this.user.email;
        });

        // !!! check that it is clickable only when button is valid
        this.profileUpdateInfoBtn.addEventListener('click', (e)=>{
            this.profileInvalidEmailFeedback.textContent = "";
            this.profileEditEmailInput.classList.remove("is-invalid");
            this.profileInvalidDisplayNameFeedback.textContent = "";
            this.profileEditDisplayNameInput.classList.remove("is-invalid");

            let body = {};

            if (this.profileEditEmailInput.value.length > 0 && this.profileEditEmailInput.value != this.user.email) {
                body['email'] = this.profileEditEmailInput.value;
            }

            if (this.profileEditDisplayNameInput.value.length > 0 && this.profileEditDisplayNameInput.value != this.user.username) {
                body['display_name'] = this.profileEditDisplayNameInput.value;
            }

            updateInfo(JSON.stringify(body)).then((updatedFields)=>{
                $(`#edit-info-modal`).modal('hide');
                redirectTo(`/profiles/${updatedFields.display_name}`);
            }).catch(errors=>{
                console.log(errors);
                if (errors['email'] && errors.email.length > 0) {
                    this.profileInvalidEmailFeedback.textContent = errors.email[0];
                    this.profileEditEmailInput.classList.add("is-invalid");
                }

                if (errors['display_name'] && errors.display_name.length > 0) {
                    this.profileInvalidDisplayNameFeedback.textContent = errors.display_name[0];
                    this.profileEditDisplayNameInput.classList.add("is-invalid");
                }


                this.profileEditInfoBtn.setAttribute('disabled', "");
            });
        });
    }
}