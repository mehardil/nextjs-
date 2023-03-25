import React, { useState, useEffect } from "react";
import { useToasts } from "react-toast-notifications";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/router";
import classNames from "classnames";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventAddonTable from "@/components/common/AddonTable";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import AddonPageModal from "@/components/modals/AddonPageModal";
import EventAddonModal from "@/components/modals/EventAddonModal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import NavTabs from "@/components/ui/NavTabs";
import Panel from "@/components/ui/Panel";
import PopupAlert from "@/components/ui/PopupAlert";
import { ADMIN } from "@/constants/roles";
import actionTypes from "@/contexts/action-types";
import { useEventDispatch } from "@/contexts/EventContext";
import apiPaths from "@/routes/api";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import { withEvent } from "@/utils/pipes";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";
import context from "@/components/forPage/EventProgram/context";

const EventAddonsPage = ({
  eventAddonPages,
  eventAddons,
  event,
  headers,
  context,
}) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const [isShowPageModal, setShowPageModal] = useState(false);
  const [isShowAddonModal, setShowAddonModal] = useState(false);
  const [activeAddon, setActiveAddon] = useState();
  const [activeAddonPage, setActiveAddonPage] = useState();
  const [isSaving, setSaving] = useState(false);
  const [isSavingAddonPage, setSavingAddonPage] = useState(false);
  const [showConfirmDeletePage, setShowConfirmDeletePage] = useState(false);
  const [showConfirmDeleteAddon, setShowConfirmDeleteAddon] = useState(false);
  const activeAddonPageId = context.query.pageId
    ? parseInt(context.query.pageId)
    : eventAddonPages[0]?.id;
  const addonPages = eventAddonPages.map((page) => ({
    ...page,
    link: interpolatePath(paths.ADMIN_EVT_ADDONS, {
      eventId: event.id,
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
      {!!eventAddonPages.length && !!activeAddonPageId ? (
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
          <div className="table-responsive ">
            <EventAddonTable
              addonPage={eventAddonPages.find(
                (addonPage) => addonPage.id === activeAddonPageId
              )}
              items={eventAddons}
              onEdit={(item) => {
                setActiveAddon(item);
                setShowAddonModal(true);
              }}
              onDelete={(item) => {
                setActiveAddon(item);
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

  const onSubmitAddonPage = async (data) => {
    setSavingAddonPage(true);

    try {
      const params = requestParamBuilder(data);
      const url = activeAddonPage
        ? apiPaths.EVT_ADDON_PAGE
        : apiPaths.EVT_ADDON_PAGES;
      await api({
        headers,
        method: activeAddonPage ? "PUT" : "POST",
        data: params,
        url: interpolatePath(url, {
          eventId: context.query.eventId,
          addonPageId: activeAddonPage?.id,
        }),
      });

      addToast(
        t("common.notifs.successfullySaved", {
          entityName: "",
          entity: t("common.addonPage", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      setActiveAddonPage(undefined);
      setShowPageModal(false);
      router.push(router);
    } catch (e) {
      addToast(
        t("common.notifs.failedToSave", {
          entityName: "",
          entity: t("common.addonPage", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    } finally {
      setSavingAddonPage(false);
    }
  };

  const onDeleteAddonPage = async () => {
    try {
      await api({
        headers,
        method: "DELETE",
        url: interpolatePath(apiPaths.EVT_ADDON_PAGE, {
          eventId: context.query.eventId,
          addonPageId: activeAddonPage?.id,
        }),
      });

      addToast(
        t("common.notifs.successfullyDeleted", {
          entityName: activeAddonPage?.name,
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

  const onSubmitAddon = async ({
    event_attendee_types,
    event_items,
    ...data
  }) => {
    setSaving(true);

    try {
      const url = !activeAddon ? apiPaths.EVT_ADDONS : apiPaths.EVT_ADDON;
      const params = requestParamBuilder(data, {
        formData: true,
        isPut: !!activeAddon?.id,
        sanitize: true,
      });

      if (event_attendee_types) {
        event_attendee_types.forEach((type, index) => {
          params.append(`event_attendee_types[${index}]`, type.value);
        });
      }

      if (event_items) {
        event_items.forEach((item, index) => {
          params.append(`event_items[${index}]`, item.value);
        });
      }

      await api({
        method: "POST",
        data: params,
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
        url: interpolatePath(url, {
          eventId: context.query.eventId,
          addonId: activeAddon?.id,
        }),
      });

      addToast(
        t("common.notifs.successfullySaved", {
          entityName: "",
          entity: t("common.addon", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      setActiveAddon(undefined);
      setShowAddonModal(false);
      router.push(router);
    } catch (e) {
      addToast(
        t("common.notifs.failedToSave", {
          entityName: "",
          entity: t("common.addon", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    } finally {
      setSaving(false);
    }
  };
  const onDeleteAddon = async () => {
    try {
      await api({
        headers,
        method: "DELETE",
        url: interpolatePath(apiPaths.EVT_ADDON, {
          eventId: context.query.eventId,
          addonId: activeAddon?.id,
        }),
      });

      addToast(
        t("common.notifs.successfullyDeleted", {
          entityName: activeAddon?.name,
          entity: t("common.addon", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      setActiveAddon(undefined);
      setShowConfirmDeleteAddon(false);
      router.push(router);
    } catch (e) {
      addToast(
        t("common.notifs.failedToDelete", {
          entityName: activeAddon?.name,
          entity: t("common.addon", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    }
  };

  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, eventDispatch]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Addons" />
      {isShowPageModal && (
        <AddonPageModal
          defaultValues={activeAddonPage}
          isShow={isShowPageModal}
          onHide={() => setShowPageModal(false)}
          onSubmit={onSubmitAddonPage}
        />
      )}
      {isShowAddonModal && (
        <EventAddonModal
          onSubmit={onSubmitAddon}
          isShow={isShowAddonModal}
          isSaving={isSaving}
          defaultValues={{
            ...activeAddon,
            event_addon_page: activeAddonPageId,
          }}
          onHide={() => {
            setActiveAddon(undefined);
            setShowAddonModal(false);
          }}
        />
      )}
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
      {showConfirmDeleteAddon && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText="Delete"
          confirmBtnBsStyle="danger"
          title="Delete Confirmation"
          focusCancelBtn
          onConfirm={onDeleteAddon}
          onCancel={() => {
            setActiveAddon(undefined);
            setShowConfirmDeleteAddon(false);
          }}
        >
          {t("common.alerts.areYouSureToDelete", {
            entityName: activeAddon?.name,
            entity: t("common.addonPage", { entries: 1 }),
          })}
        </PopupAlert>
      )}
      <NavTabs
        tabs={addonPages}
        paneled
        inverse
        components={{
          Tab: CustomTab,
          Content: CustomContent,
          Toolbar: CustomToolbar,
        }}
      />
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = (context) =>
  serverSidePipe(context, [withEvent])(async (context, pipeProps) => {
    const session = await getSession(context);

    if (session) {
      let eventAddonsResponse;
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      };

      try {
        const { data: eventAddonPagesData } = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_ADDON_PAGES, {
            eventId: context.query.eventId,
          }),
        });

        if (eventAddonPagesData.data.length || context.query.pageId) {
          eventAddonsResponse = await api({
            headers,
            url: interpolatePath(apiPaths.EVT_ADDONS, {
              eventId: context.query.eventId,
              query: {
                includes: "costs",
                append: "linked_event_attendee_types,linked_event_items",
                page:
                  context.query.pageId || eventAddonPagesData?.data?.[0]?.id,
              },
            }),
          });
        }

        return {
          props: {
            headers,
            session,
            context: await getContextProps(context),
            eventAddonPages: eventAddonPagesData.data,
            ...pipeProps,
            ...(eventAddonsResponse?.data && {
              eventAddons: eventAddonsResponse.data.data,
            }),
          },
        };
      } catch (e) {
        return {
          notFound: true,
        };
      }
    }

    return {
      notFound: true,
    };
  });

EventAddonsPage.authorized = true;
EventAddonsPage.allowedRoles = [ADMIN];
EventAddonsPage.Layout = ViewEventLayout;

export default EventAddonsPage;
