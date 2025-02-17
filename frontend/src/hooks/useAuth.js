// src/hooks/useAuth.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "../utils/api";

export default function useAuth() {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        getUser()
            .then((res) => {
                console.log("✅ User data fetched:", res.data); // The user object
                setUser(res.data);  // Store only the user payload
            })
            .catch(() => {
                localStorage.removeItem("token");
                router.push("/login");
            });
    }, [router]);

    return user;
}