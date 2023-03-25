import { useState, forwardRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import { ADMIN } from "@/constants/roles";
import withTablePaginationProps from "@/components/hocs/withTablePaginationProps";
import apiPaths from "@/routes/api";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";

const SpamUser = ({ spamUsers, context, session, meta, headers }) => {
  const router = useRouter();
  const t = useTranslations();
  const { addToast } = useToasts();
  const initialNumOfEntries = context.query.perPage;
  const [activeUser, setActiveUser] = useState();
  const [isSettingToNotSpam, setSettingToNotSpam] = useState(false);

  const tableColumns = [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "organisation", label: "Organisation" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Action", _style: { width: "15%" } },
  ];

  const handleUnspam = async (user) => {
    setSettingToNotSpam(true);
    setActiveUser(user);

    try {
      const response = await api({
        method: "PUT",
        url: interpolatePath(apiPaths.USER, { userId: user?.id }),
        data: { spam: 0 },
        headers,
      });

      addToast(
        t("common.notifs.successfullyUpdated", {
          entityName: "",
          entity: t("common.user", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      router.replace(router);
    } catch (e) {
      addToast(
        t("common.notifs.failedToUpdate", {
          entityName: "",
          entity: t("common.user", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    } finally {
      setSettingToNotSpam(false);
      setActiveUser(undefined);
    }
  };

  const tableScopedSlots = {
    actions: (item) => (
      <Button
        size="xs"
        color="white"
        onClick={() => handleUnspam(item)}
        isFullWidth
        isLoading={item?.id == activeUser?.id && isSettingToNotSpam}
        disabled={isSettingToNotSpam}
      >
        {t("common.forms.unmarkAsSpam")}
      </Button>
    ),
  };

  const SpamUsersTable = withTablePaginationProps((props) => (
    <Table
      items={spamUsers}
      columns={tableColumns}
      initialPage={meta.current_page}
      numOfPages={meta.last_page}
      totalItems={meta.total}
      from={meta.from}
      to={meta.to}
      initialKeyword={context.query.keyword}
      scopedSlots={tableScopedSlots}
      bordered
      {...{ initialNumOfEntries }}
      {...props}
    />
  ));

  return (
    <>
      <PageHeader title="Spam Users" />
      <Panel
        title={t("common.spamUsers")}
        color="inverse"
        maximizable
        collapsable
      >
        <SpamUsersTable />
      </Panel>
    </>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

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
    const spamUsersResponse = await api({
      headers,
      url: interpolatePath(apiPaths.USERS, {
        query: {
          ...context.query,
          page: context.query.page || 1,
          spam: 1,
        },
      }),
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
        spamUsers: spamUsersResponse.data.data,
        meta: spamUsersResponse.data.meta,
        headers,
      },
    };
  }

  /**
   * Always return a "prop" property, or else an
   * error will occur.
   */
  return {
    notFound: true,
  };
};

SpamUser.authorized = true;
SpamUser.allowedRoles = [ADMIN];
SpamUser.Layout = DashboardLayout;

export default SpamUser;
