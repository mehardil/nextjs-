import React, { useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/router";
import Button from "@/components/ui/Button";
import { ADMIN } from "@/constants/roles";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import EventAddonTable from "@/components/common/AddonTable";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import classNames from "classnames";
import EventAddonModal from "@/components/modals/EventAddonModal";
import AddonPageModal from "@/components/modals/AddonPageModal";
import { getSession, useSession } from "next-auth/client";
import queryString from "query-string";
import format from "date-fns/format";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import actionTypes from "@/contexts/action-types";
import { useEventDispatch } from "@/contexts/EventContext";
import { useToasts } from "react-toast-notifications";
import requestParamBuilder from "@/utils/requestParamBuilder";
import PopupAlert from "@/components/ui/PopupAlert";

const Addons = ({ event, eventAddons }) => {
  const router = useRouter();
  const [session] = useSession();
  const eventDispatch = useEventDispatch();
  const { addToast } = useToasts();
  const t = useTranslations();
  const [isGrid, setIsGrid] = React.useState(true);
  const [isShowAddonModal, setShowAddonModal] = React.useState(false);
  const [isShowPageModal, setShowPageModal] = React.useState(false);
  const [toEditAddon, setToEditAddon] = React.useState(undefined);
  const [isSaving, setSaving] = React.useState(false);
  const [showConfirmation, setShowConfirmation] = React.useState(false);

  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  const addonsToggle = () => {
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

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={() => {
        setShowAddonModal(true);
      }}
    >
      <Icon icon="plus" className="mr-1" />
      {t("common.forms.addNewEntity", {
        entity: t("common.addon", { entries: 1 }),
      })}
    </Button>
  );

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const onSaveAddon = async (data) => {
    try {
      setSaving(true);

      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
        "Content-Type": "multipart/form-data",
      };
      const url = toEditAddon
        ? `/events/${event?.id}/addons/${toEditAddon?.id}`
        : `/events/${event?.id}/addons`;
      const params = requestParamBuilder(data, {
        formData: true,
        isPut: !!toEditAddon,
      });

      await api.post(url, params, { headers });

      addToast("Addon successfully saved.", {
        appearance: "success",
        autoDismiss: true,
      });

      setToEditAddon(undefined);
      setShowAddonModal(false);

      refreshData();
    } catch (err) {
      addToast("Failed to save addon.", {
        appearance: "error",
        autoDismiss: true,
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const onDeleteAddon = async () => {
    try {
      setSaving(true);

      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      };

      await api.delete(`/events/${event?.id}/addons/${toEditAddon}`, {
        headers,
      });

      addToast("Addon successfully deleted.", {
        appearance: "success",
        autoDismiss: true,
      });

      setToEditAddon(undefined);
      setShowConfirmation(false);

      refreshData();
    } catch (err) {
      addToast("Failed to delete addon.", {
        appearance: "error",
        autoDismiss: true,
      });

      throw err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Addons" toolbar={pageHeaderToolbar} />
      {addonsToggle()}
      {isGrid && (
        <Panel
          maximizable
          className="mt-4"
          color="inverse"
          title={
            <div className="d-flex justify-content-between align-center">
              <p>Addons</p>
              <Button
                className="btn-success mr-3"
                onClick={() => setShowPageModal(true)}
              >
                Add Page
              </Button>
            </div>
          }
        >
          <EventAddonTable
            handleEdit={(item) => {
              setToEditAddon(item);
              setShowAddonModal(true);
            }}
            handleDelete={(item) => {
              setToEditAddon(item);
              setShowConfirmation(true);
            }}
            items={eventAddons}
          />
        </Panel>
      )}
      {!isGrid && (
        <Panel maximizable className="mt-4" color="inverse" title="Addons Cost">
          <EventAddonTable
            handleEdit={(item) => {
              setToEditAddon(item);
              setShowAddonModal(true);
            }}
            handleDelete={(item) => {
              setToEditAddon(item);
              setShowConfirmation(true);
            }}
            items={eventAddons}
          />
        </Panel>
      )}
      {isShowPageModal && (
        <AddonPageModal
          isShow={isShowPageModal}
          onHide={() => setShowPageModal(false)}
        />
      )}
      {isShowAddonModal && (
        <EventAddonModal
          onSubmit={onSaveAddon}
          isShow={isShowAddonModal}
          onHide={() => {
            if (toEditAddon) setToEditAddon(undefined);

            setShowAddonModal(false);
          }}
          isSaving={isSaving}
          defaultValues={toEditAddon}
        />
      )}
      {showConfirmation && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText="Delete"
          confirmBtnBsStyle="danger"
          title="Delete Confirmation"
          focusCancelBtn
          onConfirm={onDeleteAddon}
          onCancel={() => {
            setToEditAddon(undefined);
            setShowConfirmation(false);
          }}
        >
          Are you sure you want to delete this addon?
        </PopupAlert>
      )}
    </>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  const parsedQueryString = queryString.parse(context.req.url.split("?")[1]);
  const sessionQueryString = queryString.stringify({
    ...parsedQueryString,
    date: parsedQueryString.date || format(new Date(), "dd-MM-yyyy"),
  });

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}`,
        headers,
      });

      const eventAddonsResponse = await api({
        url: `/events/${context.params.eventId}/addons`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          eventAddons: eventAddonsResponse.data.data,
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
Addons.Layout = ViewEventLayout;

export default Addons;
