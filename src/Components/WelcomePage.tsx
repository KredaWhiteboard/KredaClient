import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";

function WelcomePage() {
  const [login, setLogin] = useState("");
  const navigate = useNavigate();
  const {setUsername} = useUser();

  const Submited = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const NAME = login.trim();
    if (!NAME) {
      alert("Proszę podać login.");
      return;
    }
    setUsername(NAME);

    try {
      const res = await fetch("http://localhost:5000/whiteboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ /* tu możesz przesłać dane początkowe */ }),
      });
      if (!res.ok) throw new Error("Nie udało się utworzyć tablicy");

      const { id: boardId } = await res.json();

      navigate(`/Whiteboard/${boardId}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Coś poszło nie tak przy tworzeniu tablicy.");
    }
  };
  return (
    <div id="container" className="welcome-page">
      <div className="box">
        <figure>
          <img src="public/logo_1.svg" alt="logo" />
          <figcaption>Kreda</figcaption>
        </figure>
        <form onSubmit={Submited}>
          <input
            type="text"
            id="login"
            placeholder="Wprowadź login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
          <div className="color-select">
            <div id="cl1"></div>
            <div id="cl2"></div>
            <div id="cl3"></div>
            <div id="cl4"></div>
            <div id="cl5"></div>
            <div id="cl6"></div>
          </div>
          <button type="submit">Potwierdź</button>
        </form>
      </div>
    </div>
  );
}

export default WelcomePage;
