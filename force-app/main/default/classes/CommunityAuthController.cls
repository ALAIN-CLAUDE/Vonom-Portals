public without sharing class CommunityAuthController {
    public CommunityAuthController() {

    }

    @AuraEnabled
    public static string doLogin(String username, String password){
        try {
            
            String startUrl = '/';
            ApexPages.PageReference pageRef = Site.login(username, password, startUrl);

            if(pageRef != null) return pageRef.getUrl();

            throw new CalloutException();


        } catch (Exception e) {
            system.debug('e.getMessagelogin+   '+e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }
	
    @AuraEnabled
    public static string registerUser(String firstName, String lastName, String username, String email, String communityNickname, String password, String organization, String role, String abstractval){
        system.debug('firstName-------------> '+firstName);
        system.debug('lastName---------------> '+lastName);
  
        try {

            Set<String> communityNicknameSet = new Set<String>();
            String recordTypeDeveloperName = 'PersonAccount';
			Id recordTypeId = [SELECT Id FROM RecordType WHERE SObjectType = 'Account' AND DeveloperName = :recordTypeDeveloperName LIMIT 1].Id;


           for(User usr : [Select Id, CommunityNickname From User Where CommunityNickname != null]){

                communityNicknameSet.add(usr.CommunityNickname);
            }

            String uniqueCommunityNickName;

            if(communityNicknameSet.isEmpty()){

                if(communityNickname.length() > 4){
                    
                    uniqueCommunityNickName = communityNickname.substring(0, 4) + String.valueOf( Integer.valueOf(Math.random() * 10000) );
                
                } else {

                    uniqueCommunityNickName = communityNickname + String.valueOf( Integer.valueOf(Math.random() * 10000) );
                }
            
            } else {

                for(Integer i=1; i <= 9999 ; i++){

                    if(communityNickname.length() > 4){
                        
                        uniqueCommunityNickName = communityNickname.substring(0, 4) + String.valueOf( Integer.valueOf(Math.random() * 10000) );
                    
                    } else {

                        uniqueCommunityNickName = communityNickname + String.valueOf( Integer.valueOf(Math.random() * 10000) );
                    }

                    if(!communityNicknameSet.contains(uniqueCommunityNickName)){

                        break;
                    }
                }
            }
            User adminUser = [Select Id, UserRoleId, IsActive, name From User Where Profile.Name='System Administrator' and IsActive =true Limit 1];

            User u = new User();
            u.firstName = firstName;
            u.lastName = lastName;
            u.Username = username;
            u.Email = email;
            u.CommunityNickname = uniqueCommunityNickName;
            u.Abstract_Title__c = abstractval;
            u.Organization__c = organization;
            u.portal_user_role__c = role;

            String accountId;

            Account portalAccount = new Account();
            portalAccount.FirstName =firstName;
            portalAccount.LastName =lastName;
            //portalAccount.Name = firstName + ' ' + lastName;
            portalAccount.recordTypeId= recordTypeId;
            portalAccount.OwnerId=adminUser.Id;
           
            insert portalAccount;


            accountId = portalAccount.Id;
            //password='asd123$A';
            
			system.debug('portalAccount++++++++++'+portalAccount);

            String userId = Site.createPortalUser(u, accountId, null,true);
			system.debug('user++++++++++'+userId);
            if (userId != null) {
                
                //String emailResult = sendWelcomeMail(u, userId);
                
                if (password != null && password.length() > 1) {
                    ApexPages.PageReference pageRef = Site.login(username, password, null);
                    if(pageRef != null) return pageRef.getUrl();
                }
                else {
                    ApexPages.PageReference page = System.Page.SiteLogin;
                    page.setRedirect(true);
                    return page.getUrl();
                }
            }

            throw new CalloutException();

        } catch (Exception e) {
            system.debug('e.getMessage+   '+e.getMessage());
             throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static boolean isEmailExist(String username){
        try {
            
            List<User> userList = new List<User>();
            userList = [Select Id, Name,email From User Where email = :username];

            return !userList.isEmpty();


        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }



    @AuraEnabled
    public static string sendWelcomeMail(User usr, String userId){
        try {

            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();

            List<EmailTemplate> welcomeTemplate = new List<EmailTemplate>([Select Id from EmailTemplate where name = 'Welcome to community']);
                     
            //mail.setSenderDisplayName(System.Label.Community_Email_Sender);
            mail.setTargetObjectId(userId);
            mail.setTemplateId(welcomeTemplate[0].Id);
            mail.setSaveAsActivity(false);

            Messaging.sendEmail( new List<Messaging.SingleEmailMessage>{mail} );

            return 'success';

        } catch (Exception e) {            
            throw new AuraHandledException(e.getMessage());
        }
    }

      /*
    *Method Name 	 : resetPasswordLink
    *Desc			 : Send reset password link to user.
    *Return type	 : String
    *Parameter		 : Email
    */
    @AuraEnabled
    public static String resetPasswordLink(String inputemail) {
        System.debug('inputemail------------------> '+inputemail);
        
        String processMsg = '';
        String userID;
        String userName;
        String listSize;
        List<UserLogin> loginHistoryDetailList = new List<UserLogin>();
        try {
            Boolean Valid = false;
            
            if (!String.isBlank(inputemail)) {
                inputemail = String.escapeSingleQuotes(inputemail);
                if (Site.isValidUsername(inputemail)) {
                    List<User> userToResetPassword = [Select ID ,Email,Username
                                                      FROM USER
                                                      WHERE Email =: inputemail];
           System.debug('userToResetPassword----------------------------------> '+userToResetPassword);
                    for(User usr : userToResetPassword) {
                        userID = usr.ID;
                        userName = usr.Username;
                    }
                    loginHistoryDetailList = [SELECT IsPasswordLocked FROM UserLogin WHERE UserId =: userID LIMIT 1];
                    if(loginHistoryDetailList.size()>0) {
                            if(loginHistoryDetailList[0].IsPasswordLocked) {
                                processMsg = 'UserLockedOut';
                                return processMsg;
                            }
                        Valid = true;
                    } else {
                        Valid = true;
                    }
                    
                    if(Valid == true) {
                        if(!userToResetPassword.IsEmpty()){
                            if(Site.forgotPassword(userName)){
                                processMsg = 'LoginResetSuccess'; 
                            }
                        }
                    }
                }
                if(String.isBlank(processMsg)){
                    processMsg ='invalidUserName';
                }                               
            }
            return processMsg;
        } catch (exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }
}