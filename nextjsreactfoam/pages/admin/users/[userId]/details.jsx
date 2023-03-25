import React, { useEffect } from "react";
import { getSession, useSession } from "next-auth/client";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/common/PageHeader";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import ProfileForm from "@/components/forms/ProfileForm";
import UserProfileLayout from "@/components/layouts/UserProfileLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import actionTypes from "@/contexts/action-types";
import { useProfileState, useProfileDispatch } from "@/contexts/ProfileContext";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import requestParamBuilder from "@/utils/requestParamBuilder";
import { useToasts } from "react-toast-notifications";

const AdminUserProfileDetails = ({ user, session }) => {
  const router = useRouter();
  const t = useTranslations();
  const methods = useForm({ defaultValues: user });
  const profileDispatch = useProfileDispatch();
  const profileState = useProfileState();
  const { addToast } = useToasts();

  const handleProfileUpdate = async (params) => {
    let paramsArr = requestParamBuilder(params);
    const requestParams = {
      ...paramsArr,
      gender: paramsArr?.gender,
      extra_emails: paramsArr.extra_emails.map((emails) => emails.value),
      _method: "PUT",
    };

    try {
      const response = await api({
        url: `users/${profileState.user.id}`,
        method: "POST",
        data: requestParams,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });

      addToast("Profile successfully saved.", {
        appearance: "success",
        autoDismiss: true,
      });

      router.push(router);
    } catch (e) {
      addToast("Failed to save profile.", {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  const pageHeaderToolbar = (
    <div className="row justify-content-end mb-2">
      <Button
        className=""
        color="primary"
        isCircle
        onClick={methods.handleSubmit(handleProfileUpdate)}
      >
        <Icon icon="save" type="far" className="mr-1" />
        {t("common.forms.saveChanges")}
      </Button>
    </div>
  );

  useEffect(() => {
    profileDispatch({
      type: actionTypes.PROFILE_PREVIEW,
      payload: user,
    });
  }, [user]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Edit User Profile" toolbar={pageHeaderToolbar} />
      <Panel title="Edit Profile" color="inverse">
        <FormProvider {...methods}>
          <ProfileForm
            fields={[ProfileForm.GENERAL_DETAILS, ProfileForm.PASSPORT]}
          />
        </FormProvider>
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  /**
   * To request to an authorized API, session has to be set. Session
   * has the accessToken which is required to access Currinda API.
   */
  if (session) {
    /**
     * nextApi is a utility to make a request to the
     * nextJS API (not Currinda API). It is an instance with the
     * App URL as its baseURL.
     */
    const response = await api({
      url: `/users/${context.params.userId}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });
    /**
     * MUST: Always pass the session and context
     * data to the component to have an access to essential
     * data such as the "session.accessToken" inside the component.
     */
    return {
      props: {
        session,
        context: await getContextProps(context),
        user: {
          ...response.data.data,
          extra_emails: response.data.data.extra_emails.map((emails) => {
            return { label: emails.email, value: emails.email };
          }),
        },
      },
    };
  }

  return {
    props: {},
  };
};

AdminUserProfileDetails.authorized = true;
AdminUserProfileDetails.Layout = UserProfileLayout;

export default AdminUserProfileDetails;
