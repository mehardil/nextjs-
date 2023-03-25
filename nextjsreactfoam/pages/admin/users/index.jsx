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

const AllUsers = ({ users, context, session, meta, headers }) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const t = useTranslations();
  const initialNumOfEntries = context.query.perPage;
  const [isProcessing, setProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState();
  const [activeUser, setActiveUser] = useState();

  const tableColumns = [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "organisation", label: "Organisation" },
    {
      key: "actions",
      label: "Action",
      _style: { width: !isProcessing ? "8%" : "14%" },
    },
  ];

  const handleSetAsSpam = async (user) => {
    setProcessing(true);
    setActiveUser(user);
    setProcessingLabel("Updating...");

    try {
      const response = await api({
        method: "PUT",
        url: interpolatePath(apiPaths.USER, { userId: user?.id }),
        data: { spam: 1 },
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
      setProcessing(false);
      setActiveUser(undefined);
    }
  };

  const tableScopedSlots = {
    first_name: ({ id, first_name }) => {
      return (
        <Link
          href={{ pathname: paths.ADMIN_USERS_PROFILE, query: { userId: id } }}
        >
          <a>{first_name}</a>
        </Link>
      );
    },
    last_name: ({ id, last_name }) => {
      return (
        <Link
          href={{ pathname: paths.ADMIN_USERS_PROFILE, query: { userId: id } }}
        >
          <a>{last_name}</a>
        </Link>
      );
    },
    actions: (item) => (
      <Button.Dropdown
        size="xs"
        color="white"
        className="w-100"
        options={[
          {
            label: t("common.forms.setAsSpam"),
            onClick: () => handleSetAsSpam(item),
          },
        ]}
      >
        <Link href={`users/${item.id}`}>
          <Button
            tag="a"
            color="white"
            size="xs"
            isFullWidth
            isLoading={activeUser?.id == item?.id && isProcessing}
            disabled={isProcessing}
          >
            {(activeUser?.id == item?.id && processingLabel) ||
              t("common.forms.view")}
          </Button>
        </Link>
      </Button.Dropdown>
    ),
  };

  const UsersTable = withTablePaginationProps((props) => (
    <Table
      items={users}
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

  const pageHeaderToolbar = (
    <Link
      href={{
        pathname: paths.ADMIN_USERS_ADD,
      }}
      passHref
    >
      <Button tag="a" color="primary" isCircle>
        <Icon icon="plus" className="mr-1" />
        Add User
      </Button>
    </Link>
  );

  return (
    <ContentErrorBoundary>
      <PageHeader title="Users" toolbar={pageHeaderToolbar} />
      <Panel
        title={t("common.user", { entries: 2 })}
        color="inverse"
        maximizable
        collapsable
      >
        <UsersTable />
      </Panel>
    </ContentErrorBoundary>
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
    const response = await api({
      headers,
      url: interpolatePath(apiPaths.USERS, {
        query: {
          ...context.query,
          page: context.query.page || 1,
          spam: 0,
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
        users: response.data.data,
        meta: response.data.meta,
        headers,
      },
    };
  }

  /**
   * Always return a "prop" property, or else an
   * error will occur.
   */
  return {
    props: {},
  };
};

AllUsers.authorized = true;
AllUsers.allowedRoles = [ADMIN];
AllUsers.Layout = DashboardLayout;
AllUsers.defaultProps = {
  user_r: [],
};

export default AllUsers;
