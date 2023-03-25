import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useToasts } from "react-toast-notifications";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import UserViewProfile from "@/components/common/UserViewProfile";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const UserProfile = ({ user }) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const t = useTranslations();

  const pageHeaderToolbar = (
    <Link
      href={{
        pathname: paths.USER_PROFILE_EDIT,
      }}
      passHref
    >
      <Button tag="a" className="mr-1" color="primary" isCircle>
        <Icon icon="edit" type="far" className="mr-1" />
        {t("common.forms.editEntity", {
          entity: t("common.profile"),
        })}
      </Button>
    </Link>
  );

  return (
    <ContentErrorBoundary>
      <PageHeader title={t("common.profile")} toolbar={pageHeaderToolbar} />
      <UserViewProfile {...{ user }} />
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

UserProfile.authorized = true;
// UserProfile.allowedRoles = [];
UserProfile.Layout = DashboardLayout;

export default UserProfile;
