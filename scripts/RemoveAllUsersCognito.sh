#!/bin/bash
source .env

USER_POOL_ID=$AWS_USER_POOL_ID_TEST
echo "Removing User Pool for Testing: Type=User Pool-ID="$USER_POOL_ID
 
RUN=1
until [ $RUN -eq 0 ] ; do
echo "Listing users"
USERS=`aws cognito-idp list-users --user-pool-id ${USER_POOL_ID} | grep Username | awk -F: '{print $2}' | sed -e 's/\"//g' | sed -e 's/,//g'`
if [ ! "x$USERS" = "x" ] ; then
	for user in $USERS; do
		echo "Deleting user $user"
		aws cognito-idp admin-delete-user --user-pool-id ${USER_POOL_ID} --username ${user}
		echo "Result code: $?"
		echo "Done"
	done
else
	echo "Done, no more users"
	RUN=0
fi
done

echo "Removing User Pool for Testing: Type=Employee"
USER_POOL_ID=$AWS_EMPLOYEE_POOL_ID_TEST
 
RUN=1
until [ $RUN -eq 0 ] ; do
echo "Listing users"
USERS=`aws cognito-idp list-users  --user-pool-id ${USER_POOL_ID} | grep Username | awk -F: '{print $2}' | sed -e 's/\"//g' | sed -e 's/,//g'`
if [ ! "x$USERS" = "x" ] ; then
	for user in $USERS; do
		echo "Deleting user $user"
		aws cognito-idp admin-delete-user --user-pool-id ${USER_POOL_ID} --username ${user}
		echo "Result code: $?"
		echo "Done"
	done
else
	echo "Done, no more users"
	RUN=0
fi
done