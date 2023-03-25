import React from "react";
import PageHeader from "@/components/common/PageHeader";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/client";
import { useRouter } from "next/router";
import Button from "@/components/ui/Button";
import { ADMIN } from "@/constants/roles";
import ViewOrganisationLayout from "@/components/layouts/ViewOrganisationLayout";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import apiPaths from "@/routes/api";
import OrganisationAddonTable from "@/components/common/AddonTable";
import { getSession } from "next-auth/client";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import actionTypes from "@/contexts/action-types";
import queryString from "query-string";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";
import classNames from "classnames";
import OrganisationAddonModal from "@/components/modals/OrganisationAddonModal";
import OrganisationAddonPageModal from "@/components/modals/AddonPageModal";
import isObject from "lodash/isObject";
import { useToasts } from "react-toast-notifications";
import formatISO from "date-fns/formatISO";
import PopupAlert from "@/components/ui/PopupAlert";
import NavTabs from "@/components/ui/NavTabs";
import interpolatePath from "@/utils/interpolatePath";
import paths from "@/routes/paths";
import Link from "next/link";

const Addons = ({ organisation, context, ...props }) => {
  const router = useRouter();
  const organisationDispatch = useOrganisationDispatch();
  const [session, loading] = useSession();
  const t = useTranslations();
  const [isGrid, setIsGrid] = React.useState(true);
  const [isShowAddonModal, setShowAddonModal] = React.useState(false);
  const [isShowPageModal, setShowPageModal] = React.useState(false);
  const [toEditAddon, setToEditAddon] = React.useState({});
  const [isSaving, setSaving] = React.useState(false);
  const [isSavingAddonPage, setSavingAddonPage] = React.useState(false);
  const [toEditAddonPage, setToEditAddonPage] = React.useState({});
  const [addonPage, setAddonPage] = React.useState([]);
  const [addons, setAddons] = React.useState([]);
  const [toDeleteAddonId, setToDeleteAddonId] = React.useState({});
  const [showDeleteConfirmAddon, setShowDeleteConfirmAddon] =
    React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { addToast } = useToasts();
  const [activeAddonPage, setActiveAddonPage] = React.useState();
  const [showConfirmDeletePage, setShowConfirmDeletePage] =
    React.useState(false);
  const [showConfirmDeleteAddon, setShowConfirmDeleteAddon] =
    React.useState(false);
  const [activeAddon, setActiveAddon] = React.useState();
  React.useEffect(() => {
    organisationDispatch({
      type: actionTypes.SET_ORGANISATION,
      payload: organisation,
    });
  }, [organisation]);
  React.useEffect(() => {
    const fetchAddon = async () => {
      try {
        const response = await api({
          url: `/organisations/${organisation?.id}/addons`,
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "X-Tenant": getTenant(),
          },
        });
        setAddons(response.data.data);
      } catch (e) {
        addToast("Failed to fetch addons", {
          appearance: "error",
          autoDismiss: true,
        });
      }
    };

    const fetchAddonPage = async () => {
      try {
        const response = await api({
          url: `/organisations/${organisation?.id}/addon-pages`,
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "X-Tenant": getTenant(),
          },
        });
        setAddonPage(response.data.data);
      } catch (e) {
        addToast("Failed to fetch addons-page", {
          appearance: "error",
          autoDismiss: true,
        });
      }
    };

    fetchAddon();
    fetchAddonPage();
  }, []);

  const addonsToggler = () => {
    return (
      <div className="mb-4">
        <ul className="nav nav-pills nav-sm">
          <li className="nav-items">
            <a
              className={classNames("nav-link  btn", { active: isGrid })}
              onClick={() => setIsGrid(true)}
            >
              <span className="d-sm-block">Addons</span>
            </a>
          </li>
          <li className="nav-items">
            <a
              className={classNames("nav-link btn", { active: !isGrid })}
              onClick={() => setIsGrid(false)}
            >
              <span className="d-sm-block">Addons Cost</span>
            </a>
          </li>
        </ul>
      </div>
    );
  };

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const onAddonSubmit = async ({
    membership_chapter,
    membership_category,
    membership_type,
    type,
    quantity,
    cost,
    organisation_addon_page,
    ...params
  }) => {
    const formData = {
      membership_chapter: isObject(membership_chapter)
        ? membership_chapter
            .map((item) => {
              return item.value;
            })
            .join(",")
        : membership_chapter,
      membership_category: isObject(membership_category)
        ? membership_category
            .map((item) => {
              return item.value;
            })
            .join(",")
        : membership_category,
      organisation_addon_page: isObject(organisation_addon_page)
        ? organisation_addon_page?.value
        : organisation_addon_page,
      membership_type: isObject(membership_type)
        ? membership_type
            .map((item) => {
              return item.value;
            })
            .join(",")
        : membership_type,
      organisation: organisation?.id,
      type: isObject(type) ? type?.value : type,
      ...params,
      quantity: quantity?.value,
      cost: isObject(cost)
        ? cost
            .map((item) => {
              return item.value;
            })
            .join(",")
        : cost,
    };

    try {
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      };

      setSaving(true);
      if (toEditAddon?.id) {
        await api.put(
          `/organisations/${organisation?.id}/addons/${toEditAddon?.id}`,
          formData,
          { headers }
        );
      } else {
        await api.post(`/organisations/${organisation?.id}/addons`, formData, {
          headers,
        });
      }

      addToast("Addon successfully saved.", {
        appearance: "success",
        autoDismiss: true,
      });

      setToEditAddon({});

      refreshData();
    } catch (e) {
      addToast("Failed to save addon.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setShowAddonModal(false);
      setToEditAddon({});
    }
  };

  // const onDeleteAddon = async () => {
  //   try {
  //     const headers = {
  //       Authorization: `Bearer ${session.accessToken}`,
  //       "X-Tenant": getTenant(),
  //     };

  //     setIsDeleting(true);

  //     await api({
  //       // `/organisations/${organisation?.id}/addons/${activeAddon?.id}`,
  //       // { headers }
  //       headers,
  //       method: "DELETE",
  //       url: interpolatePath(apiPaths.ORGS_ADDON_PAGE, {
  //         organisationId: organisation.id,
  //         organisationAddonId: activeAddon?.id,
  //       }),
  //     });

  //     addToast("Addon successfully deleted.", {
  //       appearance: "success",
  //       autoDismiss: true,
  //     });

  //     setToDeleteAddonId({});

  //     refreshData();
  //   } catch (e) {
  //     addToast("Failed to delete addon.", {
  //       appearance: "error",
  //       autoDismiss: true,
  //     });
  //   } finally {
  //     setIsDeleting(false);
  //     setShowDeleteConfirmAddon(false);
  //   }
  // };

  const onDeleteAddon = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      };
      await api({
        headers,
        method: "DELETE",
        url: interpolatePath(apiPaths.ORGS_ADDON, {
          organisationId: organisation.id,
          organisationAddonId: toDeleteAddonId?.id,
        }),
      });

      addToast(
        t("common.notifs.successfullyDeleted", {
          entityName: toDeleteAddonId?.name,
          entity: t("common.addon", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      setToDeleteAddonId(undefined);
      setShowConfirmDeleteAddon(false);
      router.push(router);
    } catch (e) {
      addToast(
        t("common.notifs.failedToDelete", {
          entityName: toDeleteAddonId?.name,
          entity: t("common.addon", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    }
  };

  const onSaveAddonPageChanges = async ({
    locked_end,
    locked_start,
    locked_timezone,
    ...params
  }) => {
    setSaving(true);
    const formData = {
      locked_start: locked_start && formatISO(locked_start),
      locked_end: locked_end && formatISO(locked_end),
      locked_timezone: isObject(locked_timezone)
        ? locked_timezone?.value
        : locked_timezone,
      addons_locked_timezone: params?.addons_locked_timezone?.value,
      description: params?.description,
      name: params?.name,
      organisation: organisation?.id,
      addons_locked: params?.addons_locked,
    };

    try {
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      };
      const response = await api.put(
        `/organisations/${organisation?.id}/addon-pages/${toEditAddonPage?.id}`,
        formData,
        { headers }
      );

      addToast("Successfully added Addons Page", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast("Failed to added Addons Page", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setAddonPage({});
    }
  };

  const onAddonPageCreate = async ({
    locked_end,
    locked_start,
    locked_timezone,
    ...params
  }) => {
    setSaving(true);
    const formData = {
      locked_start: locked_start && formatISO(locked_start),
      locked_end: locked_end && formatISO(locked_end),
      locked_timezone: isObject(locked_timezone)
        ? locked_timezone?.valueAddonPage
        : locked_timezone,
      addons_locked_timezone: params?.addons_locked_timezone?.value,
      description: params?.description,
      name: params?.name,
      organisation: organisation?.id,
      addons_locked: params?.addons_locked,
    };
    try {
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      };
      const response = await api.post(
        `/organisations/${organisation?.id}/addon-pages`,
        formData,
        { headers }
      );

      addToast("Successfully added addon pages", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast("Failed to added addon pages", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setShowPageModal(false);
    }
  };

  const onAddonPageSubmit = async (params) => {
    toEditAddonPage?.id
      ? onSaveAddonPageChanges(params)
      : onAddonPageCreate(params);
  };

  const onHandleAddonEditPage = (item) => {
    setToEditAddonPage(item);
    setShowPageModal(true);
  };
  const onHandleAddonEdit = (item) => {
    setToEditAddon(item);
    setShowAddonModal(true);
  };

  const onHandleAddonDelete = (id) => {
    setToDeleteAddonId(id);
    setShowConfirmDeleteAddon(true);
  };

  const activeAddonPageId = context.query.pageId
    ? parseInt(context.query.pageId)
    : addonPage[0]?.id;

  const addonPagee = addonPage.map((page) => ({
    ...page,
    link: interpolatePath(paths.ADMIN_ORG_ADDONS, {
      organisationId: organisation.id,
      query: {
        pageId: page.id,
      },
    }),
  }));

  const CustomTab = (addonPage) => {
    return (
      <li className="nav-item">
        <Link href={addonPage?.link}>
          <a
            className={classNames("nav-link", {
              show: context.query.pageId == addonPage?.id,
              active: addonPage?.id === activeAddonPageId,
            })}
          >
            <span className="d-sm-inline-block text-teal">
              {addonPage?.name}
            </span>
            <Button
              size="xs"
              color="secondary"
              className="ml-1"
              isOutline
              isIcon
              onClick={(e) => {
                e.preventDefault();
                setActiveAddonPage(addonPage);
                setShowPageModal(true);
                onHandleAddonEditPage(addonPage);
              }}
            >
              <Icon icon="pencil-alt" />
            </Button>
            <Button
              size="xs"
              color="danger"
              className="ml-1"
              isOutline
              isIcon
              onClick={(e) => {
                e.preventDefault();
                setActiveAddonPage(addonPage);
                setShowConfirmDeletePage(true);
              }}
            >
              <Icon icon="times" />
            </Button>
          </a>
        </Link>
      </li>
    );
  };
  const CustomContent = () => (
    <>
      {!!addonPage.length && !!activeAddonPageId ? (
        <>
          <div className="mb-4 text-right">
            <Button
              color="primary"
              isCircle
              onClick={() => setShowAddonModal(true)}
            >
              <Icon icon="plus" className="mr-1" />
              {t("common.forms.addNewEntity", {
                entity: t("common.addon", { entries: 1 }),
              })}
            </Button>
          </div>
          <div className="table-responsive">
            <OrganisationAddonTable
              addonPage={addonPage.find(
                (addonPage) => addonPage.id === activeAddonPageId
              )}
              items={addons}
              onEdit={(item) => {
                onHandleAddonEdit(item);
                setShowAddonModal(true);
              }}
              onDelete={(item) => {
                onHandleAddonDelete(item);
                setShowConfirmDeleteAddon(true);
              }}
            />
          </div>
        </>
      ) : (
        <div className="text-center p-2">No addon page found.</div>
      )}
    </>
  );

  const CustomToolbar = () => (
    <Button
      color="success"
      size="xs"
      className="mt-2"
      onClick={() => setShowPageModal(true)}
    >
      <Icon icon="plus" className="mr-2" />
      Add Addon Page
    </Button>
  );

  const onDeleteAddonPage = async () => {
    try {
      await api({
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
        method: "DELETE",
        url: interpolatePath(apiPaths.ORGS_ADDON_PAGE, {
          organisationId: context.query.organisationId,
          addonPageId: activeAddonPage?.id,
        }),
      });

      addToast(
        t("common.notifs.successfullyDeleted", {
          entityName: activeAddonPage?.organisationId,
          entity: t("common.addonPage", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      setActiveAddonPage(undefined);
      setShowConfirmDeletePage(false);
      router.push(router);
    } catch (e) {
      addToast(
        t("common.notifs.failedToDelete", {
          entityName: activeAddonPage?.name,
          entity: t("common.addonPage", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    }
  };

  return (
    <ContentErrorBoundary>
      <PageHeader title="Addons" />

      {showConfirmDeletePage && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText="Delete"
          confirmBtnBsStyle="danger"
          title="Delete Confirmation"
          focusCancelBtn
          onConfirm={onDeleteAddonPage}
          onCancel={() => {
            setActiveAddonPage(undefined);
            setShowConfirmDeletePage(false);
          }}
        >
          {t("common.alerts.areYouSureToDelete", {
            entityName: activeAddonPage?.name,
            entity: t("common.addonPage", { entries: 1 }),
          })}
        </PopupAlert>
      )}

      {addonsToggler()}
      {isGrid && (
        <NavTabs
          maximizable
          tabs={addonPagee}
          paneled
          inverse
          components={{
            Tab: CustomTab,
            Content: CustomContent,
            Toolbar: CustomToolbar,
          }}
        />
      )}
      {!isGrid && (
        <Panel
          maximizable
          className="mt-4"
          color="inverse"
          title={<> Addons Cost</>}
        >
          <div className="table-responsive">
            <OrganisationAddonTable items={addons} />
          </div>
        </Panel>
      )}
      {isShowPageModal && (
        <OrganisationAddonPageModal
          isShow={isShowPageModal}
          onHide={() => {
            setShowPageModal(false);
            setToEditAddonPage();
          }}
          defaultValues={toEditAddonPage}
          onSubmit={onAddonPageSubmit}
          isSaving={isSaving}
        />
      )}
      {isShowAddonModal && (
        <OrganisationAddonModal
          isShow={isShowAddonModal}
          isSaving={isSaving}
          defaultValues={toEditAddon}
          onHide={() => setShowAddonModal(false)}
          onSubmit={onAddonSubmit}
        />
      )}
      {showConfirmDeleteAddon && (
        <PopupAlert
          title={t("common.alerts.areYouSureToDelete", {
            entityName: activeAddonPage?.name,
            entity: t("common.addonPage", { entries: 1 }),
          })}
          type="danger"
          desc=""
          showCancel
          confirmBtnText="Delete"
          confirmBtnBsStyle="danger"
          onConfirm={onDeleteAddon}
          onCancel={() => {
            setToDeleteAddonId({});
            setShowConfirmDeleteAddon(false);
          }}
        />
      )}
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  const parsedQueryString = queryString.parse(context.req.url.split("?")[1]);
  const urlQueryString = queryString.stringify({
    ...parsedQueryString,
    page: context.query.page || 1,
  });

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const organisationResponse = await api({
        url: `/organisations/${context.query.organisationId}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          organisation: organisationResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

Addons.authorized = true;
Addons.allowedRoles = [ADMIN];
Addons.Layout = ViewOrganisationLayout;
Addons.defaultProps = {
  Addonss: [],
};

export default Addons;
