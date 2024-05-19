import {formatAvatar, modalsToCloseList, navigateTo, redirectTo} from "../helpers.js";
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
        const username = this.getAttribute("username");
        const firstMe = this.getAttribute("first-me");
        if (username) {
            this.user = await getUserByDisplayName(username);
            if (!this.user) {
                this.innerHTML = `<tr-not-found><tr-not-found>`
                return;
            }
        } else {
            this.user = JSON.parse(firstMe);
            this.user = await getUserByDisplayName(this.user.display_name);
            history.pushState(null, null, `/profiles/${this.user.display_name}`)
        }

        this.render(this.user.display_name, this.user.email);
        this.avatar.setAttribute("src", formatAvatar(this.user.avatar));

        this.initAvatarChangeComponents();
        this.initInfoChangeComponents();

        if (this.user.is_me > 0) {
            this.avatarEditIcon.style.display = "inline-block";
            this.profileEditInfoBtn.style.display = "inline-block";
        } else {
            this.initStatusBadge();
            if (this.user.is_online) {
                this.profileSmallOnOffStatus.classList.remove("bg-secondary");
                this.profileSmallOnOffStatus.classList.add("bg-success");
            }
            this.profileSmallOnOffStatus.style.display = "block";
        }

        this.renderSmallFriendsList();

        modalsToCloseList.push("edit-info-modal")
        modalsToCloseList.push("view-all-friends-modal")
        modalsToCloseList.push("change-avatar-modal")

        this.otpSwitch.addEventListener('click', this.getOTPHandler())
        document.title = "Profile";
    }

    render() {
        this.innerHTML = `
            <tr-nav current-active="profile"></tr-nav>
            <div class="container">
            <!-- First Row -->
            <div class="row mt-3">
                <!-- Avatar -->
                <div style="position: relative;" class="col-6">
                    <div id="profile-small-on-off-status" style="display: none; width: 10px; height: 10px;" class="rounded-circle bg-secondary"></div>
                    <img id="profile-avatar" class="d-block m-auto rounded-circle" width="200" height="200" alt="avatar">
                    <div id="profile-status-badge"></div>
                    <a data-toggle="modal" data-target="#change-avatar-modal" href="#" style="position: absolute; top:0; right:0;"><i style="display:none;" id="profile-image-edit-icon" class="fa-solid fa-pencil"></i></a>
                    <button style="display: none;" id="send_friend_request_btn" class="btn btn-success">Send Friend Request</button>
                    <button style="display: none;" id="approve_friend_request_btn" class="btn btn-success">Approve Friend Request</button>
                    <button style="display: none;" id="remove_friend_btn" class="btn btn-danger">Remove Friend</button>
                    <button style="display: none;" id="block_btn" class="btn btn-danger">Block <i class="fa-solid fa-ban"></i></button>
                    <button style="display: none;" id="unblock_btn" class="btn btn-warning">Unblock</button>
                    <button style="display: none"  id="profile_send_msg_btn" class="btn btn-primary float-right">Send Message</button>
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
                 <!-- Settings -->
                <div class="col-6">
                    <div class="card h-100">
                        <h5 class="card-header">Settings</h5>
                        <div id="profile-settings" class="list-group list-group-flush"></div>  
                        <div class="card-body">
                            <div class="custom-control custom-switch">
                              <input type="checkbox" class="custom-control-input" id="otp-switch">
                              <label class="custom-control-label" for="otp-switch">Turn On 2FA <i class="fa-solid fa-qrcode"></i></label>
                            </div>
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
    
        <!-- Modal To Set 2FA-->
        <div class="modal fade" id="set-qr-modal" tabindex="-1" role="dialog" aria-labelledby="cset-qr-modal" aria-hidden="true">
<!--        <div id="profile-wrong-avatar-format-alert" class="alert alert-danger collapse" role="alert">-->
<!--            We accept only <b>JPEG</b> fomat for avatars-->
<!--        </div>-->
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Setting 2FA</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div>
                        <div class="mb-4 d-flex justify-content-center">
                            <svg width="61mm" height="61mm" version="1.1" viewBox="0 0 61 61" xmlns="http://www.w3.org/2000/svg"><path d="M4,4H5V5H4zM5,4H6V5H5zM6,4H7V5H6zM7,4H8V5H7zM8,4H9V5H8zM9,4H10V5H9zM10,4H11V5H10zM12,4H13V5H12zM13,4H14V5H13zM15,4H16V5H15zM16,4H17V5H16zM17,4H18V5H17zM19,4H20V5H19zM23,4H24V5H23zM27,4H28V5H27zM31,4H32V5H31zM33,4H34V5H33zM34,4H35V5H34zM35,4H36V5H35zM37,4H38V5H37zM40,4H41V5H40zM41,4H42V5H41zM42,4H43V5H42zM43,4H44V5H43zM45,4H46V5H45zM46,4H47V5H46zM50,4H51V5H50zM51,4H52V5H51zM52,4H53V5H52zM53,4H54V5H53zM54,4H55V5H54zM55,4H56V5H55zM56,4H57V5H56zM4,5H5V6H4zM10,5H11V6H10zM14,5H15V6H14zM15,5H16V6H15zM16,5H17V6H16zM17,5H18V6H17zM20,5H21V6H20zM21,5H22V6H21zM22,5H23V6H22zM29,5H30V6H29zM38,5H39V6H38zM39,5H40V6H39zM42,5H43V6H42zM46,5H47V6H46zM47,5H48V6H47zM50,5H51V6H50zM56,5H57V6H56zM4,6H5V7H4zM6,6H7V7H6zM7,6H8V7H7zM8,6H9V7H8zM10,6H11V7H10zM14,6H15V7H14zM20,6H21V7H20zM21,6H22V7H21zM22,6H23V7H22zM25,6H26V7H25zM26,6H27V7H26zM28,6H29V7H28zM29,6H30V7H29zM30,6H31V7H30zM32,6H33V7H32zM33,6H34V7H33zM36,6H37V7H36zM39,6H40V7H39zM47,6H48V7H47zM50,6H51V7H50zM52,6H53V7H52zM53,6H54V7H53zM54,6H55V7H54zM56,6H57V7H56zM4,7H5V8H4zM6,7H7V8H6zM7,7H8V8H7zM8,7H9V8H8zM10,7H11V8H10zM12,7H13V8H12zM13,7H14V8H13zM14,7H15V8H14zM16,7H17V8H16zM19,7H20V8H19zM21,7H22V8H21zM23,7H24V8H23zM26,7H27V8H26zM28,7H29V8H28zM31,7H32V8H31zM34,7H35V8H34zM35,7H36V8H35zM38,7H39V8H38zM40,7H41V8H40zM43,7H44V8H43zM45,7H46V8H45zM46,7H47V8H46zM48,7H49V8H48zM50,7H51V8H50zM52,7H53V8H52zM53,7H54V8H53zM54,7H55V8H54zM56,7H57V8H56zM4,8H5V9H4zM6,8H7V9H6zM7,8H8V9H7zM8,8H9V9H8zM10,8H11V9H10zM12,8H13V9H12zM13,8H14V9H13zM15,8H16V9H15zM18,8H19V9H18zM20,8H21V9H20zM21,8H22V9H21zM23,8H24V9H23zM26,8H27V9H26zM28,8H29V9H28zM29,8H30V9H29zM30,8H31V9H30zM31,8H32V9H31zM32,8H33V9H32zM34,8H35V9H34zM35,8H36V9H35zM36,8H37V9H36zM37,8H38V9H37zM41,8H42V9H41zM42,8H43V9H42zM44,8H45V9H44zM45,8H46V9H45zM46,8H47V9H46zM50,8H51V9H50zM52,8H53V9H52zM53,8H54V9H53zM54,8H55V9H54zM56,8H57V9H56zM4,9H5V10H4zM10,9H11V10H10zM12,9H13V10H12zM20,9H21V10H20zM22,9H23V10H22zM23,9H24V10H23zM24,9H25V10H24zM25,9H26V10H25zM26,9H27V10H26zM27,9H28V10H27zM28,9H29V10H28zM32,9H33V10H32zM33,9H34V10H33zM34,9H35V10H34zM36,9H37V10H36zM38,9H39V10H38zM39,9H40V10H39zM41,9H42V10H41zM44,9H45V10H44zM45,9H46V10H45zM46,9H47V10H46zM50,9H51V10H50zM56,9H57V10H56zM4,10H5V11H4zM5,10H6V11H5zM6,10H7V11H6zM7,10H8V11H7zM8,10H9V11H8zM9,10H10V11H9zM10,10H11V11H10zM12,10H13V11H12zM14,10H15V11H14zM16,10H17V11H16zM18,10H19V11H18zM20,10H21V11H20zM22,10H23V11H22zM24,10H25V11H24zM26,10H27V11H26zM28,10H29V11H28zM30,10H31V11H30zM32,10H33V11H32zM34,10H35V11H34zM36,10H37V11H36zM38,10H39V11H38zM40,10H41V11H40zM42,10H43V11H42zM44,10H45V11H44zM46,10H47V11H46zM48,10H49V11H48zM50,10H51V11H50zM51,10H52V11H51zM52,10H53V11H52zM53,10H54V11H53zM54,10H55V11H54zM55,10H56V11H55zM56,10H57V11H56zM12,11H13V12H12zM13,11H14V12H13zM14,11H15V12H14zM19,11H20V12H19zM22,11H23V12H22zM23,11H24V12H23zM24,11H25V12H24zM25,11H26V12H25zM26,11H27V12H26zM27,11H28V12H27zM28,11H29V12H28zM32,11H33V12H32zM33,11H34V12H33zM34,11H35V12H34zM35,11H36V12H35zM41,11H42V12H41zM43,11H44V12H43zM46,11H47V12H46zM4,12H5V13H4zM8,12H9V13H8zM10,12H11V13H10zM11,12H12V13H11zM12,12H13V13H12zM14,12H15V13H14zM16,12H17V13H16zM17,12H18V13H17zM19,12H20V13H19zM21,12H22V13H21zM22,12H23V13H22zM23,12H24V13H23zM24,12H25V13H24zM27,12H28V13H27zM28,12H29V13H28zM29,12H30V13H29zM30,12H31V13H30zM31,12H32V13H31zM32,12H33V13H32zM34,12H35V13H34zM35,12H36V13H35zM36,12H37V13H36zM37,12H38V13H37zM38,12H39V13H38zM40,12H41V13H40zM42,12H43V13H42zM44,12H45V13H44zM45,12H46V13H45zM49,12H50V13H49zM50,12H51V13H50zM51,12H52V13H51zM52,12H53V13H52zM53,12H54V13H53zM56,12H57V13H56zM6,13H7V14H6zM7,13H8V14H7zM8,13H9V14H8zM9,13H10V14H9zM13,13H14V14H13zM18,13H19V14H18zM20,13H21V14H20zM23,13H24V14H23zM26,13H27V14H26zM27,13H28V14H27zM28,13H29V14H28zM30,13H31V14H30zM32,13H33V14H32zM34,13H35V14H34zM36,13H37V14H36zM37,13H38V14H37zM39,13H40V14H39zM40,13H41V14H40zM41,13H42V14H41zM42,13H43V14H42zM43,13H44V14H43zM46,13H47V14H46zM47,13H48V14H47zM48,13H49V14H48zM49,13H50V14H49zM51,13H52V14H51zM52,13H53V14H52zM53,13H54V14H53zM54,13H55V14H54zM55,13H56V14H55zM56,13H57V14H56zM7,14H8V15H7zM10,14H11V15H10zM11,14H12V15H11zM14,14H15V15H14zM15,14H16V15H15zM25,14H26V15H25zM26,14H27V15H26zM28,14H29V15H28zM29,14H30V15H29zM31,14H32V15H31zM34,14H35V15H34zM39,14H40V15H39zM40,14H41V15H40zM41,14H42V15H41zM42,14H43V15H42zM43,14H44V15H43zM44,14H45V15H44zM45,14H46V15H45zM46,14H47V15H46zM48,14H49V15H48zM54,14H55V15H54zM56,14H57V15H56zM4,15H5V16H4zM5,15H6V16H5zM6,15H7V16H6zM11,15H12V16H11zM12,15H13V16H12zM13,15H14V16H13zM14,15H15V16H14zM15,15H16V16H15zM16,15H17V16H16zM18,15H19V16H18zM20,15H21V16H20zM25,15H26V16H25zM29,15H30V16H29zM32,15H33V16H32zM34,15H35V16H34zM35,15H36V16H35zM36,15H37V16H36zM37,15H38V16H37zM40,15H41V16H40zM41,15H42V16H41zM42,15H43V16H42zM43,15H44V16H43zM45,15H46V16H45zM48,15H49V16H48zM4,16H5V17H4zM8,16H9V17H8zM10,16H11V17H10zM15,16H16V17H15zM23,16H24V17H23zM28,16H29V17H28zM31,16H32V17H31zM32,16H33V17H32zM35,16H36V17H35zM39,16H40V17H39zM40,16H41V17H40zM49,16H50V17H49zM55,16H56V17H55zM56,16H57V17H56zM4,17H5V18H4zM6,17H7V18H6zM7,17H8V18H7zM8,17H9V18H8zM15,17H16V18H15zM16,17H17V18H16zM17,17H18V18H17zM19,17H20V18H19zM21,17H22V18H21zM23,17H24V18H23zM24,17H25V18H24zM25,17H26V18H25zM28,17H29V18H28zM30,17H31V18H30zM32,17H33V18H32zM33,17H34V18H33zM35,17H36V18H35zM42,17H43V18H42zM43,17H44V18H43zM46,17H47V18H46zM47,17H48V18H47zM48,17H49V18H48zM49,17H50V18H49zM55,17H56V18H55zM6,18H7V19H6zM9,18H10V19H9zM10,18H11V19H10zM11,18H12V19H11zM15,18H16V19H15zM21,18H22V19H21zM26,18H27V19H26zM27,18H28V19H27zM28,18H29V19H28zM29,18H30V19H29zM30,18H31V19H30zM32,18H33V19H32zM33,18H34V19H33zM35,18H36V19H35zM37,18H38V19H37zM39,18H40V19H39zM43,18H44V19H43zM44,18H45V19H44zM46,18H47V19H46zM49,18H50V19H49zM51,18H52V19H51zM53,18H54V19H53zM55,18H56V19H55zM56,18H57V19H56zM4,19H5V20H4zM6,19H7V20H6zM7,19H8V20H7zM11,19H12V20H11zM13,19H14V20H13zM15,19H16V20H15zM16,19H17V20H16zM17,19H18V20H17zM20,19H21V20H20zM21,19H22V20H21zM22,19H23V20H22zM23,19H24V20H23zM25,19H26V20H25zM26,19H27V20H26zM29,19H30V20H29zM31,19H32V20H31zM32,19H33V20H32zM37,19H38V20H37zM38,19H39V20H38zM39,19H40V20H39zM40,19H41V20H40zM41,19H42V20H41zM46,19H47V20H46zM47,19H48V20H47zM49,19H50V20H49zM50,19H51V20H50zM52,19H53V20H52zM55,19H56V20H55zM56,19H57V20H56zM5,20H6V21H5zM6,20H7V21H6zM9,20H10V21H9zM10,20H11V21H10zM12,20H13V21H12zM13,20H14V21H13zM14,20H15V21H14zM15,20H16V21H15zM16,20H17V21H16zM18,20H19V21H18zM19,20H20V21H19zM20,20H21V21H20zM21,20H22V21H21zM23,20H24V21H23zM26,20H27V21H26zM27,20H28V21H27zM28,20H29V21H28zM29,20H30V21H29zM33,20H34V21H33zM34,20H35V21H34zM35,20H36V21H35zM37,20H38V21H37zM39,20H40V21H39zM40,20H41V21H40zM41,20H42V21H41zM42,20H43V21H42zM43,20H44V21H43zM45,20H46V21H45zM46,20H47V21H46zM49,20H50V21H49zM50,20H51V21H50zM56,20H57V21H56zM13,21H14V22H13zM15,21H16V22H15zM16,21H17V22H16zM18,21H19V22H18zM19,21H20V22H19zM21,21H22V22H21zM22,21H23V22H22zM25,21H26V22H25zM26,21H27V22H26zM30,21H31V22H30zM34,21H35V22H34zM36,21H37V22H36zM39,21H40V22H39zM40,21H41V22H40zM41,21H42V22H41zM46,21H47V22H46zM47,21H48V22H47zM48,21H49V22H48zM49,21H50V22H49zM53,21H54V22H53zM55,21H56V22H55zM56,21H57V22H56zM4,22H5V23H4zM6,22H7V23H6zM7,22H8V23H7zM9,22H10V23H9zM10,22H11V23H10zM11,22H12V23H11zM12,22H13V23H12zM13,22H14V23H13zM17,22H18V23H17zM20,22H21V23H20zM22,22H23V23H22zM25,22H26V23H25zM26,22H27V23H26zM28,22H29V23H28zM29,22H30V23H29zM32,22H33V23H32zM33,22H34V23H33zM34,22H35V23H34zM35,22H36V23H35zM36,22H37V23H36zM38,22H39V23H38zM41,22H42V23H41zM42,22H43V23H42zM44,22H45V23H44zM45,22H46V23H45zM46,22H47V23H46zM47,22H48V23H47zM51,22H52V23H51zM53,22H54V23H53zM55,22H56V23H55zM4,23H5V24H4zM5,23H6V24H5zM8,23H9V24H8zM12,23H13V24H12zM13,23H14V24H13zM14,23H15V24H14zM18,23H19V24H18zM19,23H20V24H19zM22,23H23V24H22zM23,23H24V24H23zM26,23H27V24H26zM31,23H32V24H31zM32,23H33V24H32zM36,23H37V24H36zM38,23H39V24H38zM39,23H40V24H39zM40,23H41V24H40zM41,23H42V24H41zM42,23H43V24H42zM43,23H44V24H43zM44,23H45V24H44zM46,23H47V24H46zM47,23H48V24H47zM49,23H50V24H49zM51,23H52V24H51zM52,23H53V24H52zM54,23H55V24H54zM55,23H56V24H55zM56,23H57V24H56zM4,24H5V25H4zM6,24H7V25H6zM7,24H8V25H7zM10,24H11V25H10zM14,24H15V25H14zM15,24H16V25H15zM16,24H17V25H16zM20,24H21V25H20zM21,24H22V25H21zM22,24H23V25H22zM24,24H25V25H24zM27,24H28V25H27zM28,24H29V25H28zM30,24H31V25H30zM33,24H34V25H33zM34,24H35V25H34zM36,24H37V25H36zM37,24H38V25H37zM39,24H40V25H39zM40,24H41V25H40zM41,24H42V25H41zM43,24H44V25H43zM44,24H45V25H44zM46,24H47V25H46zM47,24H48V25H47zM49,24H50V25H49zM51,24H52V25H51zM52,24H53V25H52zM55,24H56V25H55zM9,25H10V26H9zM11,25H12V26H11zM12,25H13V26H12zM14,25H15V26H14zM15,25H16V26H15zM17,25H18V26H17zM19,25H20V26H19zM22,25H23V26H22zM23,25H24V26H23zM25,25H26V26H25zM27,25H28V26H27zM29,25H30V26H29zM31,25H32V26H31zM34,25H35V26H34zM36,25H37V26H36zM37,25H38V26H37zM39,25H40V26H39zM40,25H41V26H40zM44,25H45V26H44zM47,25H48V26H47zM48,25H49V26H48zM51,25H52V26H51zM52,25H53V26H52zM53,25H54V26H53zM56,25H57V26H56zM5,26H6V27H5zM10,26H11V27H10zM11,26H12V27H11zM14,26H15V27H14zM16,26H17V27H16zM18,26H19V27H18zM20,26H21V27H20zM23,26H24V27H23zM24,26H25V27H24zM31,26H32V27H31zM32,26H33V27H32zM33,26H34V27H33zM34,26H35V27H34zM35,26H36V27H35zM37,26H38V27H37zM39,26H40V27H39zM40,26H41V27H40zM46,26H47V27H46zM48,26H49V27H48zM50,26H51V27H50zM53,26H54V27H53zM56,26H57V27H56zM4,27H5V28H4zM5,27H6V28H5zM7,27H8V28H7zM9,27H10V28H9zM13,27H14V28H13zM15,27H16V28H15zM17,27H18V28H17zM18,27H19V28H18zM20,27H21V28H20zM22,27H23V28H22zM24,27H25V28H24zM25,27H26V28H25zM26,27H27V28H26zM27,27H28V28H27zM32,27H33V28H32zM33,27H34V28H33zM36,27H37V28H36zM41,27H42V28H41zM42,27H43V28H42zM48,27H49V28H48zM49,27H50V28H49zM51,27H52V28H51zM52,27H53V28H52zM4,28H5V29H4zM5,28H6V29H5zM6,28H7V29H6zM7,28H8V29H7zM8,28H9V29H8zM9,28H10V29H9zM10,28H11V29H10zM11,28H12V29H11zM12,28H13V29H12zM13,28H14V29H13zM14,28H15V29H14zM15,28H16V29H15zM16,28H17V29H16zM18,28H19V29H18zM19,28H20V29H19zM21,28H22V29H21zM22,28H23V29H22zM25,28H26V29H25zM27,28H28V29H27zM28,28H29V29H28zM29,28H30V29H29zM30,28H31V29H30zM31,28H32V29H31zM32,28H33V29H32zM34,28H35V29H34zM36,28H37V29H36zM37,28H38V29H37zM38,28H39V29H38zM40,28H41V29H40zM44,28H45V29H44zM48,28H49V29H48zM49,28H50V29H49zM50,28H51V29H50zM51,28H52V29H51zM52,28H53V29H52zM53,28H54V29H53zM55,28H56V29H55zM56,28H57V29H56zM4,29H5V30H4zM5,29H6V30H5zM7,29H8V30H7zM8,29H9V30H8zM12,29H13V30H12zM14,29H15V30H14zM15,29H16V30H15zM16,29H17V30H16zM18,29H19V30H18zM19,29H20V30H19zM23,29H24V30H23zM24,29H25V30H24zM26,29H27V30H26zM28,29H29V30H28zM32,29H33V30H32zM36,29H37V30H36zM39,29H40V30H39zM40,29H41V30H40zM42,29H43V30H42zM43,29H44V30H43zM44,29H45V30H44zM48,29H49V30H48zM52,29H53V30H52zM54,29H55V30H54zM55,29H56V30H55zM56,29H57V30H56zM4,30H5V31H4zM6,30H7V31H6zM7,30H8V31H7zM8,30H9V31H8zM10,30H11V31H10zM12,30H13V31H12zM13,30H14V31H13zM16,30H17V31H16zM17,30H18V31H17zM18,30H19V31H18zM20,30H21V31H20zM27,30H28V31H27zM28,30H29V31H28zM30,30H31V31H30zM32,30H33V31H32zM36,30H37V31H36zM39,30H40V31H39zM41,30H42V31H41zM43,30H44V31H43zM44,30H45V31H44zM46,30H47V31H46zM48,30H49V31H48zM50,30H51V31H50zM52,30H53V31H52zM55,30H56V31H55zM56,30H57V31H56zM7,31H8V32H7zM8,31H9V32H8zM12,31H13V32H12zM14,31H15V32H14zM15,31H16V32H15zM17,31H18V32H17zM19,31H20V32H19zM20,31H21V32H20zM21,31H22V32H21zM23,31H24V32H23zM24,31H25V32H24zM25,31H26V32H25zM27,31H28V32H27zM28,31H29V32H28zM32,31H33V32H32zM37,31H38V32H37zM43,31H44V32H43zM44,31H45V32H44zM46,31H47V32H46zM48,31H49V32H48zM52,31H53V32H52zM53,31H54V32H53zM56,31H57V32H56zM5,32H6V33H5zM6,32H7V33H6zM8,32H9V33H8zM9,32H10V33H9zM10,32H11V33H10zM11,32H12V33H11zM12,32H13V33H12zM13,32H14V33H13zM15,32H16V33H15zM17,32H18V33H17zM20,32H21V33H20zM21,32H22V33H21zM22,32H23V33H22zM24,32H25V33H24zM25,32H26V33H25zM27,32H28V33H27zM28,32H29V33H28zM29,32H30V33H29zM30,32H31V33H30zM31,32H32V33H31zM32,32H33V33H32zM37,32H38V33H37zM38,32H39V33H38zM41,32H42V33H41zM43,32H44V33H43zM45,32H46V33H45zM47,32H48V33H47zM48,32H49V33H48zM49,32H50V33H49zM50,32H51V33H50zM51,32H52V33H51zM52,32H53V33H52zM55,32H56V33H55zM7,33H8V34H7zM8,33H9V34H8zM12,33H13V34H12zM13,33H14V34H13zM14,33H15V34H14zM15,33H16V34H15zM19,33H20V34H19zM20,33H21V34H20zM22,33H23V34H22zM23,33H24V34H23zM26,33H27V34H26zM27,33H28V34H27zM28,33H29V34H28zM29,33H30V34H29zM34,33H35V34H34zM35,33H36V34H35zM38,33H39V34H38zM41,33H42V34H41zM42,33H43V34H42zM43,33H44V34H43zM45,33H46V34H45zM46,33H47V34H46zM48,33H49V34H48zM49,33H50V34H49zM51,33H52V34H51zM52,33H53V34H52zM53,33H54V34H53zM54,33H55V34H54zM56,33H57V34H56zM5,34H6V35H5zM6,34H7V35H6zM7,34H8V35H7zM10,34H11V35H10zM11,34H12V35H11zM16,34H17V35H16zM17,34H18V35H17zM20,34H21V35H20zM21,34H22V35H21zM25,34H26V35H25zM27,34H28V35H27zM32,34H33V35H32zM34,34H35V35H34zM35,34H36V35H35zM36,34H37V35H36zM37,34H38V35H37zM38,34H39V35H38zM39,34H40V35H39zM41,34H42V35H41zM42,34H43V35H42zM43,34H44V35H43zM44,34H45V35H44zM46,34H47V35H46zM48,34H49V35H48zM49,34H50V35H49zM50,34H51V35H50zM51,34H52V35H51zM56,34H57V35H56zM4,35H5V36H4zM6,35H7V36H6zM9,35H10V36H9zM13,35H14V36H13zM15,35H16V36H15zM17,35H18V36H17zM18,35H19V36H18zM21,35H22V36H21zM22,35H23V36H22zM23,35H24V36H23zM24,35H25V36H24zM25,35H26V36H25zM26,35H27V36H26zM29,35H30V36H29zM31,35H32V36H31zM33,35H34V36H33zM35,35H36V36H35zM36,35H37V36H36zM37,35H38V36H37zM38,35H39V36H38zM39,35H40V36H39zM40,35H41V36H40zM41,35H42V36H41zM42,35H43V36H42zM43,35H44V36H43zM44,35H45V36H44zM45,35H46V36H45zM47,35H48V36H47zM50,35H51V36H50zM53,35H54V36H53zM56,35H57V36H56zM4,36H5V37H4zM5,36H6V37H5zM10,36H11V37H10zM11,36H12V37H11zM12,36H13V37H12zM13,36H14V37H13zM19,36H20V37H19zM22,36H23V37H22zM26,36H27V37H26zM29,36H30V37H29zM30,36H31V37H30zM32,36H33V37H32zM33,36H34V37H33zM34,36H35V37H34zM35,36H36V37H35zM38,36H39V37H38zM39,36H40V37H39zM41,36H42V37H41zM43,36H44V37H43zM46,36H47V37H46zM49,36H50V37H49zM51,36H52V37H51zM53,36H54V37H53zM54,36H55V37H54zM4,37H5V38H4zM5,37H6V38H5zM7,37H8V38H7zM9,37H10V38H9zM12,37H13V38H12zM13,37H14V38H13zM14,37H15V38H14zM15,37H16V38H15zM16,37H17V38H16zM17,37H18V38H17zM18,37H19V38H18zM20,37H21V38H20zM24,37H25V38H24zM25,37H26V38H25zM27,37H28V38H27zM28,37H29V38H28zM30,37H31V38H30zM34,37H35V38H34zM35,37H36V38H35zM36,37H37V38H36zM38,37H39V38H38zM40,37H41V38H40zM44,37H45V38H44zM46,37H47V38H46zM47,37H48V38H47zM48,37H49V38H48zM51,37H52V38H51zM52,37H53V38H52zM55,37H56V38H55zM4,38H5V39H4zM7,38H8V39H7zM8,38H9V39H8zM10,38H11V39H10zM11,38H12V39H11zM12,38H13V39H12zM14,38H15V39H14zM15,38H16V39H15zM16,38H17V39H16zM18,38H19V39H18zM21,38H22V39H21zM23,38H24V39H23zM24,38H25V39H24zM26,38H27V39H26zM27,38H28V39H27zM28,38H29V39H28zM30,38H31V39H30zM32,38H33V39H32zM39,38H40V39H39zM40,38H41V39H40zM44,38H45V39H44zM46,38H47V39H46zM47,38H48V39H47zM48,38H49V39H48zM50,38H51V39H50zM53,38H54V39H53zM54,38H55V39H54zM55,38H56V39H55zM56,38H57V39H56zM6,39H7V40H6zM8,39H9V40H8zM14,39H15V40H14zM15,39H16V40H15zM17,39H18V40H17zM19,39H20V40H19zM22,39H23V40H22zM23,39H24V40H23zM24,39H25V40H24zM36,39H37V40H36zM39,39H40V40H39zM40,39H41V40H40zM45,39H46V40H45zM47,39H48V40H47zM48,39H49V40H48zM49,39H50V40H49zM51,39H52V40H51zM53,39H54V40H53zM56,39H57V40H56zM4,40H5V41H4zM7,40H8V41H7zM9,40H10V41H9zM10,40H11V41H10zM11,40H12V41H11zM13,40H14V41H13zM15,40H16V41H15zM17,40H18V41H17zM20,40H21V41H20zM21,40H22V41H21zM22,40H23V41H22zM23,40H24V41H23zM28,40H29V41H28zM30,40H31V41H30zM33,40H34V41H33zM34,40H35V41H34zM38,40H39V41H38zM39,40H40V41H39zM40,40H41V41H40zM41,40H42V41H41zM43,40H44V41H43zM45,40H46V41H45zM46,40H47V41H46zM47,40H48V41H47zM50,40H51V41H50zM51,40H52V41H51zM52,40H53V41H52zM56,40H57V41H56zM7,41H8V42H7zM9,41H10V42H9zM11,41H12V42H11zM12,41H13V42H12zM13,41H14V42H13zM14,41H15V42H14zM16,41H17V42H16zM18,41H19V42H18zM20,41H21V42H20zM22,41H23V42H22zM23,41H24V42H23zM24,41H25V42H24zM25,41H26V42H25zM27,41H28V42H27zM29,41H30V42H29zM31,41H32V42H31zM34,41H35V42H34zM35,41H36V42H35zM37,41H38V42H37zM38,41H39V42H38zM40,41H41V42H40zM41,41H42V42H41zM42,41H43V42H42zM43,41H44V42H43zM44,41H45V42H44zM46,41H47V42H46zM47,41H48V42H47zM49,41H50V42H49zM53,41H54V42H53zM55,41H56V42H55zM56,41H57V42H56zM4,42H5V43H4zM8,42H9V43H8zM10,42H11V43H10zM11,42H12V43H11zM14,42H15V43H14zM16,42H17V43H16zM19,42H20V43H19zM21,42H22V43H21zM22,42H23V43H22zM27,42H28V43H27zM28,42H29V43H28zM29,42H30V43H29zM30,42H31V43H30zM34,42H35V43H34zM37,42H38V43H37zM38,42H39V43H38zM41,42H42V43H41zM42,42H43V43H42zM45,42H46V43H45zM50,42H51V43H50zM51,42H52V43H51zM53,42H54V43H53zM55,42H56V43H55zM56,42H57V43H56zM7,43H8V44H7zM9,43H10V44H9zM12,43H13V44H12zM14,43H15V44H14zM15,43H16V44H15zM16,43H17V44H16zM18,43H19V44H18zM20,43H21V44H20zM21,43H22V44H21zM23,43H24V44H23zM25,43H26V44H25zM27,43H28V44H27zM29,43H30V44H29zM31,43H32V44H31zM32,43H33V44H32zM36,43H37V44H36zM38,43H39V44H38zM40,43H41V44H40zM43,43H44V44H43zM44,43H45V44H44zM47,43H48V44H47zM49,43H50V44H49zM51,43H52V44H51zM54,43H55V44H54zM4,44H5V45H4zM5,44H6V45H5zM6,44H7V45H6zM7,44H8V45H7zM9,44H10V45H9zM10,44H11V45H10zM12,44H13V45H12zM13,44H14V45H13zM14,44H15V45H14zM16,44H17V45H16zM18,44H19V45H18zM20,44H21V45H20zM21,44H22V45H21zM25,44H26V45H25zM26,44H27V45H26zM28,44H29V45H28zM30,44H31V45H30zM33,44H34V45H33zM34,44H35V45H34zM36,44H37V45H36zM37,44H38V45H37zM38,44H39V45H38zM39,44H40V45H39zM40,44H41V45H40zM42,44H43V45H42zM47,44H48V45H47zM48,44H49V45H48zM51,44H52V45H51zM4,45H5V46H4zM5,45H6V46H5zM8,45H9V46H8zM9,45H10V46H9zM15,45H16V46H15zM17,45H18V46H17zM20,45H21V46H20zM21,45H22V46H21zM23,45H24V46H23zM24,45H25V46H24zM27,45H28V46H27zM29,45H30V46H29zM31,45H32V46H31zM34,45H35V46H34zM37,45H38V46H37zM40,45H41V46H40zM41,45H42V46H41zM42,45H43V46H42zM46,45H47V46H46zM50,45H51V46H50zM53,45H54V46H53zM54,45H55V46H54zM56,45H57V46H56zM4,46H5V47H4zM5,46H6V47H5zM7,46H8V47H7zM8,46H9V47H8zM9,46H10V47H9zM10,46H11V47H10zM14,46H15V47H14zM17,46H18V47H17zM19,46H20V47H19zM21,46H22V47H21zM23,46H24V47H23zM24,46H25V47H24zM25,46H26V47H25zM26,46H27V47H26zM27,46H28V47H27zM28,46H29V47H28zM29,46H30V47H29zM34,46H35V47H34zM35,46H36V47H35zM41,46H42V47H41zM43,46H44V47H43zM44,46H45V47H44zM46,46H47V47H46zM47,46H48V47H47zM48,46H49V47H48zM50,46H51V47H50zM51,46H52V47H51zM52,46H53V47H52zM53,46H54V47H53zM54,46H55V47H54zM56,46H57V47H56zM5,47H6V48H5zM6,47H7V48H6zM11,47H12V48H11zM13,47H14V48H13zM14,47H15V48H14zM18,47H19V48H18zM19,47H20V48H19zM21,47H22V48H21zM23,47H24V48H23zM25,47H26V48H25zM27,47H28V48H27zM29,47H30V48H29zM30,47H31V48H30zM31,47H32V48H31zM32,47H33V48H32zM33,47H34V48H33zM36,47H37V48H36zM37,47H38V48H37zM39,47H40V48H39zM47,47H48V48H47zM49,47H50V48H49zM51,47H52V48H51zM52,47H53V48H52zM7,48H8V49H7zM10,48H11V49H10zM11,48H12V49H11zM14,48H15V49H14zM15,48H16V49H15zM16,48H17V49H16zM19,48H20V49H19zM22,48H23V49H22zM24,48H25V49H24zM26,48H27V49H26zM28,48H29V49H28zM29,48H30V49H29zM30,48H31V49H30zM31,48H32V49H31zM32,48H33V49H32zM33,48H34V49H33zM36,48H37V49H36zM38,48H39V49H38zM39,48H40V49H39zM44,48H45V49H44zM45,48H46V49H45zM47,48H48V49H47zM48,48H49V49H48zM49,48H50V49H49zM50,48H51V49H50zM51,48H52V49H51zM52,48H53V49H52zM53,48H54V49H53zM12,49H13V50H12zM13,49H14V50H13zM14,49H15V50H14zM16,49H17V50H16zM20,49H21V50H20zM21,49H22V50H21zM22,49H23V50H22zM23,49H24V50H23zM25,49H26V50H25zM28,49H29V50H28zM32,49H33V50H32zM34,49H35V50H34zM36,49H37V50H36zM37,49H38V50H37zM42,49H43V50H42zM44,49H45V50H44zM47,49H48V50H47zM48,49H49V50H48zM52,49H53V50H52zM53,49H54V50H53zM54,49H55V50H54zM56,49H57V50H56zM4,50H5V51H4zM5,50H6V51H5zM6,50H7V51H6zM7,50H8V51H7zM8,50H9V51H8zM9,50H10V51H9zM10,50H11V51H10zM12,50H13V51H12zM13,50H14V51H13zM15,50H16V51H15zM17,50H18V51H17zM18,50H19V51H18zM19,50H20V51H19zM20,50H21V51H20zM22,50H23V51H22zM25,50H26V51H25zM26,50H27V51H26zM27,50H28V51H27zM28,50H29V51H28zM30,50H31V51H30zM32,50H33V51H32zM33,50H34V51H33zM35,50H36V51H35zM37,50H38V51H37zM40,50H41V51H40zM41,50H42V51H41zM42,50H43V51H42zM43,50H44V51H43zM44,50H45V51H44zM45,50H46V51H45zM48,50H49V51H48zM50,50H51V51H50zM52,50H53V51H52zM55,50H56V51H55zM56,50H57V51H56zM4,51H5V52H4zM10,51H11V52H10zM13,51H14V52H13zM15,51H16V52H15zM17,51H18V52H17zM18,51H19V52H18zM19,51H20V52H19zM20,51H21V52H20zM26,51H27V52H26zM28,51H29V52H28zM32,51H33V52H32zM33,51H34V52H33zM35,51H36V52H35zM38,51H39V52H38zM43,51H44V52H43zM48,51H49V52H48zM52,51H53V52H52zM53,51H54V52H53zM56,51H57V52H56zM4,52H5V53H4zM6,52H7V53H6zM7,52H8V53H7zM8,52H9V53H8zM10,52H11V53H10zM12,52H13V53H12zM14,52H15V53H14zM16,52H17V53H16zM19,52H20V53H19zM23,52H24V53H23zM24,52H25V53H24zM27,52H28V53H27zM28,52H29V53H28zM29,52H30V53H29zM30,52H31V53H30zM31,52H32V53H31zM32,52H33V53H32zM35,52H36V53H35zM36,52H37V53H36zM37,52H38V53H37zM38,52H39V53H38zM41,52H42V53H41zM42,52H43V53H42zM43,52H44V53H43zM44,52H45V53H44zM46,52H47V53H46zM48,52H49V53H48zM49,52H50V53H49zM50,52H51V53H50zM51,52H52V53H51zM52,52H53V53H52zM53,52H54V53H53zM55,52H56V53H55zM4,53H5V54H4zM6,53H7V54H6zM7,53H8V54H7zM8,53H9V54H8zM10,53H11V54H10zM14,53H15V54H14zM16,53H17V54H16zM18,53H19V54H18zM19,53H20V54H19zM20,53H21V54H20zM21,53H22V54H21zM22,53H23V54H22zM25,53H26V54H25zM29,53H30V54H29zM30,53H31V54H30zM32,53H33V54H32zM36,53H37V54H36zM38,53H39V54H38zM42,53H43V54H42zM43,53H44V54H43zM44,53H45V54H44zM45,53H46V54H45zM46,53H47V54H46zM47,53H48V54H47zM49,53H50V54H49zM50,53H51V54H50zM53,53H54V54H53zM54,53H55V54H54zM55,53H56V54H55zM4,54H5V55H4zM6,54H7V55H6zM7,54H8V55H7zM8,54H9V55H8zM10,54H11V55H10zM15,54H16V55H15zM16,54H17V55H16zM19,54H20V55H19zM21,54H22V55H21zM22,54H23V55H22zM23,54H24V55H23zM24,54H25V55H24zM26,54H27V55H26zM28,54H29V55H28zM29,54H30V55H29zM31,54H32V55H31zM32,54H33V55H32zM38,54H39V55H38zM39,54H40V55H39zM43,54H44V55H43zM44,54H45V55H44zM45,54H46V55H45zM46,54H47V55H46zM49,54H50V55H49zM53,54H54V55H53zM56,54H57V55H56zM4,55H5V56H4zM10,55H11V56H10zM14,55H15V56H14zM16,55H17V56H16zM17,55H18V56H17zM18,55H19V56H18zM19,55H20V56H19zM23,55H24V56H23zM24,55H25V56H24zM26,55H27V56H26zM28,55H29V56H28zM31,55H32V56H31zM32,55H33V56H32zM34,55H35V56H34zM35,55H36V56H35zM36,55H37V56H36zM43,55H44V56H43zM44,55H45V56H44zM45,55H46V56H45zM49,55H50V56H49zM52,55H53V56H52zM53,55H54V56H53zM55,55H56V56H55zM56,55H57V56H56zM4,56H5V57H4zM5,56H6V57H5zM6,56H7V57H6zM7,56H8V57H7zM8,56H9V57H8zM9,56H10V57H9zM10,56H11V57H10zM12,56H13V57H12zM14,56H15V57H14zM15,56H16V57H15zM18,56H19V57H18zM19,56H20V57H19zM22,56H23V57H22zM24,56H25V57H24zM26,56H27V57H26zM29,56H30V57H29zM30,56H31V57H30zM31,56H32V57H31zM32,56H33V57H32zM35,56H36V57H35zM36,56H37V57H36zM39,56H40V57H39zM42,56H43V57H42zM43,56H44V57H43zM47,56H48V57H47zM50,56H51V57H50zM52,56H53V57H52zM53,56H54V57H53zM55,56H56V57H55z" id="qr-path" fill="#000000" fill-opacity="1" fill-rule="nonzero" stroke="none" /></svg>
                        </div>
                        <div class="d-flex justify-content-center">
                            <div data-mdb-button-init data-mdb-ripple-init class="btn btn-primary btn-rounded">
                                <label class="form-label text-white m-1" for="otp-input">Choose file</label>
                                <input type="file" class="form-control d-none" id="otp-input"/>
                            </div>
                        </div>
                    </div>                
                </div>
                <div class="modal-footer">
                    <button id="accept-qr-btn" style="display: none;" type="button" class="btn btn-success" data-dismiss="modal">Change</button>
                    <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>
        `;

        // Avatar
        this.avatar = this.querySelector("#profile-avatar");
        this.avatarEditIcon = this.querySelector("#profile-image-edit-icon");

        // Settings
        this.otpSwitch = this.querySelector("#otp-switch");

        // Status and Action Buttons
        this.profileSmallOnOffStatus = this.querySelector("#profile-small-on-off-status");
        this.profileStatusBadge = this.querySelector("#profile-status-badge");
        this.sendFriendReqBtn = this.querySelector("#send_friend_request_btn");
        this.approveFriendReqBtn = this.querySelector("#approve_friend_request_btn");
        this.removeFriendBtn = this.querySelector("#remove_friend_btn");
        this.blockBtn = this.querySelector("#block_btn");
        this.unblockBtn = this.querySelector("#unblock_btn");
        this.profileSendMsgBtn = this.querySelector("#profile_send_msg_btn");

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
        this.profileSendMsgBtn.addEventListener('click', () => {
            navigateTo(`/chat/${this.user.display_name}`)
        });

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



        if ((this.user.blocked_me === true && this.user.is_blocked_by_me === true) || this.user.is_blocked_by_me === true ) {
            this.profileStatusBadge.innerHTML = `<span class="badge badge-pill badge-danger" style="position: absolute; top:0; right:0;">Blocked</span>`
            this.unblockBtn.style.display = "inline-block";
            this.blockBtn.style.display = "none";
            this.removeFriendBtn.style.display = "none";
            this.sendFriendReqBtn.style.display = "none";
            this.approveFriendReqBtn.style.display = "none";
            this.profileSendMsgBtn.style.display = "none";
            return;
        }

        if (this.user.blocked_me === true) {
            this.profileStatusBadge.innerHTML = `<span class="badge badge-pill badge-danger" style="position: absolute; top:0; right:0;">Blocked You</span>`
            this.blockBtn.style.display = "none";
            this.unblockBtn.style.display = "none";
            this.sendFriendReqBtn.style.display = "none";
            this.approveFriendReqBtn.style.display = "none";
            this.removeFriendBtn.style.display = "none";
            this.profileSendMsgBtn.style.display = "none";
            return;
        }

        if (this.user.friend_status === "PENDING" && this.user.friend_request_sent_by_me === true) {
            this.profileStatusBadge.innerHTML = `<span class="badge badge-pill badge-primary" style="position: absolute; top:0; right:0;">Pending Friend Request</span>`
            this.blockBtn.style.display = "none";
            this.unblockBtn.style.display = "none";
            this.sendFriendReqBtn.style.display = "none";
            this.approveFriendReqBtn.style.display = "none";
            this.removeFriendBtn.style.display = "none";
            this.profileSendMsgBtn.style.display = "inline-block";
            return;
        }

        if (this.user.friend_status === "PENDING" && this.user.friend_request_sent_by_me === false) {
            this.profileStatusBadge.innerHTML = ``;
            this.approveFriendReqBtn.style.display = "inline-block";
            this.blockBtn.style.display = "inline-block";
            this.unblockBtn.style.display = "none";
            this.sendFriendReqBtn.style.display = "none";
            this.removeFriendBtn.style.display = "none";
            this.profileSendMsgBtn.style.display = "inline-block";
            return;
        }

        if (this.user.friend_status === "APPROVED") {
            this.profileStatusBadge.innerHTML = `<span class="badge badge-pill badge-success" style="position: absolute; top:0; right:0;">Friend</span>`
            this.blockBtn.style.display = "inline-block";
            this.removeFriendBtn.style.display = "inline-block";
            this.unblockBtn.style.display = "none";
            this.sendFriendReqBtn.style.display = "none";
            this.approveFriendReqBtn.style.display = "none";
            this.profileSendMsgBtn.style.display = "inline-block";
            return;
        }

        this.profileStatusBadge.innerHTML = ``;
        this.sendFriendReqBtn.style.display = "inline-block";
        this.blockBtn.style.display = "inline-block";
        this.unblockBtn.style.display = "none";
        this.approveFriendReqBtn.style.display = "none";
        this.removeFriendBtn.style.display = "none";
        this.profileSendMsgBtn.style.display = "inline-block";
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
                friendElement.setAttribute("is-online", friend.is_online);
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
                friendElement.setAttribute("is-online", friend.is_online);
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
        this.profileEditDisplayNameInput.value = this.user.display_name;
        this.profileEditEmailInput.value = this.user.email;

        this.profileEditDisplayNameInput.addEventListener("input", (e)=>{
            if (this.profileEditDisplayNameInput.value.length > 0 && this.profileEditDisplayNameInput.value != this.user.display_name) {
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
            this.profileEditDisplayNameInput.value = this.user.display_name;
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

            if (this.profileEditDisplayNameInput.value.length > 0 && this.profileEditDisplayNameInput.value != this.user.display_name) {
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

    getOTPHandler() {
        return (e) => {
            if (!this.otpSwitch.checked) {
                // send cancellation of otp
                return;
            }

            $('#set-qr-modal').modal('show');
        };
    }
}