import { useState, forwardRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import UserAdminsHeader from "@/components/common/UserAdminsHeader";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
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

const Archived = ({
  archivedAdminUsers,
  context,
  session,
  meta,
  defaultValues,
  headers,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const { addToast } = useToasts();
  const { handleSubmit, control, errors, reset } = useForm({ defaultValues });
  const initialNumOfEntries = context.query.perPage;

  const tableColumns = [
    { key: "id", label: "ID" },
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "roles", label: "Positions" },
    { key: "actions", label: "Action", _style: { width: "8%" } },
  ];

  const handleRestoreAdmin = async (user) => {
    try {
      const response = await api({
        method: "PUT",
        url: interpolatePath(apiPaths.USER, { userId: user?.id }),
        data: { archived: 0 },
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
    roles: ({ roles }) => roles?.map((role) => role.role).join(", "),
    actions: (item) => (
      <Button.Dropdown
        size="xs"
        color="white"
        options={[
          {
            label: t("common.forms.restore"),
            onClick: () => handleRestoreAdmin(item),
          },
        ]}
      >
        <Button>
          <Link
            style={{ color: "white" }}
            href={{
              pathname: paths.ADMIN_USERS_PROFILE,
              query: { userId: item?.id },
            }}
          >
            <a style={{ color: "black" }}>View</a>
          </Link>
        </Button>
      </Button.Dropdown>
    ),
  };

  const ArchivedAdminUsersTable = withTablePaginationProps((props) => (
    <Table
      items={archivedAdminUsers}
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
        pathname: paths.ADMIN_USERS_ADMIN_ADD,
      }}
      passHref
    >
      <Button tag="a" color="primary" isCircle>
        <Icon icon="plus" className="mr-1" />
        {t("common.forms.addNewEntity", {
          entity: t("common.admin", { entries: 1 }),
        })}
      </Button>
    </Link>
  );

  const onSubmit = async ({ position, ...data }) => {
    const session = await getSession(context);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };
    const formData = { position: position?.value, ...data };

    try {
      const data = await api.post("users/admins", formData, { headers });

      refreshData();
      addToast("Admin successfully added", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      addToast("Failed to add admin", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Admins"
        toolbar={pageHeaderToolbar}
        description={<UserAdminsHeader />}
      />
      <Panel title="Active Admins" color="inverse" maximizable collapsable>
        <ArchivedAdminUsersTable />
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
    const archivedAdminUsersResponse = await api({
      headers,
      url: interpolatePath(apiPaths.USERS, {
        query: {
          ...context.query,
          page: context.query.page || 1,
          archived: 1,
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
        headers,
        context: await getContextProps(context),
        archivedAdminUsers: archivedAdminUsersResponse.data.data,
        meta: archivedAdminUsersResponse.data.meta,
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

Archived.authorized = true;
Archived.allowedRoles = [ADMIN];
Archived.Layout = DashboardLayout;
Archived.defaultProps = {
  admins: [],
};

export default Archived;
