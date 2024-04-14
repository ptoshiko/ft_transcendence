import {getFriends, getMe, getUserByDisplayName, uploadAvatar} from "../service/users.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }
    
    async connectedCallback() {
        const username  = this.getAttribute("username");

        // Checking if user exists, otherwise - 404 page
        const user = await getUserByDisplayName(username);
        if (!user) {
            this.innerHTML = `<tr-not-found><tr-not-found>`
            return;
        }

        this.render(username);
        this.avatar.setAttribute("src", user.avatar);
        this.initAvatarChangeComponents();
        this.initInfoChangeComponents();

        if (user.is_me > 0) {
            this.avatarEditIcon.style.display = "inline-block";
            this.profileEditInfoBtn.style.display = "inline-block";
        }

        this.renderSmallFriendsList();

        document.title = "Profile";
    }

    render(username) {
        this.innerHTML = `
            <tr-nav username=${username}></tr-nav>
            <div class="container">
            <!-- First Row -->
            <div class="row mt-3">
                <!-- Avatar -->
                <div style="position: relative;" class="col-6">
                    <img id="profile-avatar" class="d-block m-auto rounded-circle" width="200" height="200" alt="avatar">
                    <a data-toggle="modal" data-target="#change-avatar-modal" href="#" style="position: absolute; top:0; right:0;"><i style="display:none;" id="profile-image-edit-icon" class="fa-solid fa-pencil"></i></a>
                </div>
                <!-- Info -->
                <div class="col-6">
                    <div class="card h-100">
                        <h5 class="card-header">Personal Info</h5>
                        <div class="card-body">
                            <h5 class="card-title">${username}</h5>
                            <p class="card-text"><i class="fa-solid fa-envelope mr-1"></i>gene@gmail.com</p>
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
                                <input value="genegrigorian" type="text" class="form-control" id="profile-edit-display-name-input" placeholder="Edit Display Name">
                                <div id="profile-invalid-display-name-feedback" class="invalid-feedback"></div>
                            </div>
                            <div class="form-group">
                                <label for="profile-edit-email-input">Edit Email</label>
                                <input value="gene@gmail.com" type="email" class="form-control" id="profile-edit-email-input" placeholder="Edit Email">
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
                        <button type="button" class="btn btn-secondary">Edit</button>
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

        this.avatar = this.querySelector("#profile-avatar");
        this.avatarEditIcon = this.querySelector("#profile-image-edit-icon");
        this.profileEditInfoBtn = this.querySelector("#profile-edit-info-btn");
        this.profileSmallFriendsList = this.querySelector("#profile-small-friends-list");
        this.profileViewAllFriendsBtn = this.querySelector("#profile-view-all-friends-btn");
        this.changeAvatarInput = this.querySelector("#change-avatar-input");
        this.profileChangeAvatarPreview = this.querySelector("#profile-change-avatar-preview");
        this.profileAcceptAvatarChangeBtn = this.querySelector("#profile-accept-avatar-change-btn");
        this.profileWrongAvatarFormatAlert = this.querySelector("#profile-wrong-avatar-format-alert");

        // Update Info
        this.profileEditEmailInput = this.querySelector("#profile-edit-email-input");
        this.profileEditDisplayNameInput = this.querySelector("#profile-edit-display-name-input");
        this.profileInvalidEmailFeedback = this.querySelector("#profile-invalid-email-feedback");
        this.profileInvalidDisplayNameFeedback = this.querySelector("#profile-invalid-display-name-feedback");
        this.profileUpdateInfoBtn = this.querySelector("#profile-update-info-btn");

        // show error of display name
        // show error of email
        // send update
        // clear values after close
    }


    async renderSmallFriendsList() {
        const friends = await getFriends(3, 0);

        if (friends.length <= 0) {
            this.profileSmallFriendsList.innerHTML = ``;
            this.profileViewAllFriendsBtn.style.display = "none";
        } else {
            this.profileViewAllFriendsBtn.style.display = "inline-block";
            for (friend of friends) {
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
                // this.fileToUpload = e.target.result;
            };

            reader.readAsDataURL(fileInput.files[0]);

            this.fileToUpload = fileInput.files[0];

            this.profileAcceptAvatarChangeBtn.style.display = "inline-block";
        })

        this.profileAcceptAvatarChangeBtn.addEventListener('click', (e) => {
            uploadAvatar(this.fileToUpload);
            // this.profileAcceptAvatarChangeBtn.style.display = "none";
        })
    }

    initInfoChangeComponents() {
        this.profileEditDisplayNameInput.addEventListener("input", (e)=>{
            if (this.profileEditDisplayNameInput.value.length > 0) {
                this.profileUpdateInfoBtn.removeAttribute('disabled')
            } else {
                this.profileUpdateInfoBtn.addAttribute('disabled')
            }
        })
    }
}