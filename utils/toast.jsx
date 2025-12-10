import toast from "react-hot-toast";
import { RiNotification3Fill } from "react-icons/ri";

export const notify = (
    text = "Message de notificstion par defaut",
    state = "success"
) =>
    toast(
        (t) => (
            <div
                onClick={() => toast.dismiss(t.id)}
                className={"hover:cursor-pointer"}
            >
                <div className="flex items-center justify-center space-x-2">
                    <RiNotification3Fill
                        style={{ color: state === "success" ? "green" : "red" }}
                        className={"h-6 w-6"}
                    />
                    <div className={""}>{text}</div>
                </div>
            </div>
        ),
        {
            position: "bottom-right",
            style: {
                borderRadius: "0.15rem",
                border:
                    state === "success" ? "1px solid green" : "1px solid red",
            },
        }
    );
