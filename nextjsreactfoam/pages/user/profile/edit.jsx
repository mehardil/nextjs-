import { getSession } from "next-auth/client";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/common/PageHeader";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import ProfileForm from "@/components/forms/ProfileForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const UserProfileEdit = ({ user, session }) => {
  const router = useRouter();
  const t = useTranslations();
  const methods = useForm({ defaultValues: user });

  const handleProfileUpdate = async (params) => {
    const requestParams = {
      ...params,
      _method: "PUT",
    };

    try {
      const response = await api({
        url: `users/${session?.user?.id}`,
        method: "POST",
        data: requestParams,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });

      router.push(router);
    } catch (e) {}
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

  return (
    <ContentErrorBoundary>
      <PageHeader title="Edit User Profile" toolbar={pageHeaderToolbar} />
      <Panel title="Edit Profile" color="inverse">
        <FormProvider {...methods}>
          <ProfileForm />
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
      url: `/users/${session?.user.id}`,
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
        user: response.data.data,
      },
    };
  }

  return {
    props: {},
  };
};

UserProfileEdit.authorized = true;
UserProfileEdit.Layout = DashboardLayout;

export default UserProfileEdit;
